import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getVectorStore } from '@/lib/pinecone';
import { Document } from '@langchain/core/documents';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Innertube } from 'youtubei.js';
import { Supadata } from '@supadata/js';

// Étendre le timeout Vercel à 60s (plan Pro) ou 10s (Hobby)
export const maxDuration = 60;

// Client Supadata pour l'extraction de transcriptions YouTube
const supadata = new Supadata({ apiKey: process.env.SUPADATA_API_KEY! });

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL YouTube requise.' }, { status: 400 });
    }

    // Extrait l'ID vidéo depuis l'URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return Response.json({ error: 'URL YouTube invalide.' }, { status: 400 });
    }

    // 1. Tenter de récupérer la vidéo depuis le cache PostgreSQL
    const cachedVideo = await prisma.video.findUnique({
      where: { id: videoId },
      include: { segments: { orderBy: { start: 'asc' } } },
    });

    if (cachedVideo) {
      console.log(`[Cache] Vidéo "${videoId}" récupérée depuis PostgreSQL.`);
      return Response.json({
        transcript: cachedVideo.transcript,
        pineconeIndexed: true,
        pineconeError: "",
        segments: cachedVideo.segments.map((s) => ({
          text: s.text,
          start: s.start,
          duration: s.duration,
        })),
      });
    }

    // 2. Cache miss: Appel à Supadata pour la transcription
    console.log(`[Transcript] Appel à Supadata pour "${videoId}"...`);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const transcriptData = await supadata.youtube.transcript({
      url: videoUrl,
      lang: 'fr',  // Tente le français d'abord
      text: false,  // Retourne les segments avec timestamps
    });

    // Si pas de contenu, essayer sans langue spécifique
    if (!transcriptData?.content || transcriptData.content.length === 0) {
      const fallbackData = await supadata.youtube.transcript({
        url: videoUrl,
        text: false,
      });

      if (!fallbackData?.content || fallbackData.content.length === 0) {
        return Response.json(
          { error: 'Aucun sous-titre trouvé pour cette vidéo.' },
          { status: 404 }
        );
      }

      transcriptData.content = fallbackData.content;
    }

    // Construire la transcription complète
    const contentArray = transcriptData.content as any[];
    const transcript = contentArray.map((seg) => seg.text).join(' ');

    // Normaliser les segments (offset/duration en ms depuis Supadata)
    const transcriptItems = contentArray.map((seg) => ({
      text: seg.text,
      offset: seg.offset,
      duration: seg.duration,
    }));

    // 3. Récupère les métadonnées via l'API oEmbed de YouTube (évite les blocages d'IP sur Vercel)
    let title = 'Vidéo sans titre';
    let description = '';
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    let author = '';
    let duration = 0;

    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedRes = await fetch(oEmbedUrl);
      if (oEmbedRes.ok) {
        const oData = await oEmbedRes.json();
        title = oData.title || title;
        author = oData.author_name || author;
        thumbnail = oData.thumbnail_url || thumbnail;
      }
    } catch (metadataError) {
      console.warn(`[Metadata] Échec des métadonnées pour "${videoId}":`, metadataError);
    }

    // 4. Récupérer l'utilisateur connecté (s'il y en a un)
    const currentUserRecord = await getCurrentUser();

    // 5. Enregistrer la vidéo et les segments dans PostgreSQL
    await prisma.video.create({
      data: {
        id: videoId,
        title,
        description,
        thumbnail,
        author,
        duration,
        transcript,
        userId: currentUserRecord?.id ?? null,
        segments: {
          create: transcriptItems.map((item) => ({
            text: item.text,
            start: item.offset,
            duration: item.duration,
          })),
        },
      },
    });
    console.log(`[Database] Vidéo "${videoId}" et ses segments enregistrés dans PostgreSQL.`);

    // 5. Indexation Pinecone en arrière-plan
    const indexPineconeBackground = async () => {
      try {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const groupedDocuments: Document[] = [];
        let currentText = "";
        let currentStart = 0;
        let currentDuration = 0;

        for (let i = 0; i < transcriptItems.length; i++) {
          const item = transcriptItems[i];
          if (currentText === "") {
            currentStart = item.offset;
          }
          currentText += (currentText === "" ? "" : " ") + item.text;
          currentDuration += item.duration;

          if (currentText.length >= 1000 || i === transcriptItems.length - 1) {
            groupedDocuments.push(
              new Document({
                pageContent: currentText,
                metadata: {
                  videoId,
                  start: currentStart,
                  duration: currentDuration,
                },
              })
            );
            currentText = "";
            currentDuration = 0;
          }
        }

        const splits = await splitter.splitDocuments(groupedDocuments);
        const vectorStore = await getVectorStore(videoId);
        await vectorStore.addDocuments(splits);
        console.log(`[Pinecone] ${splits.length} segments indexés dans le namespace "${videoId}"`);
      } catch (pineconeError: any) {
        console.error("Erreur Pinecone en arrière-plan:", pineconeError);
      }
    };

    indexPineconeBackground();

    return Response.json({
      transcript,
      pineconeIndexed: true,
      pineconeError: "",
      segments: transcriptItems.map((item) => ({
        text: item.text,
        start: item.offset,
        duration: item.duration,
      })),
    });
  } catch (error) {
    console.error('Erreur transcription YouTube:', error);
    return Response.json({ error: 'Impossible d\'extraire la transcription.' }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
