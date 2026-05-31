import { YoutubeTranscript } from 'youtube-transcript';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getVectorStore } from '@/lib/pinecone';
import { Document } from '@langchain/core/documents';
import { prisma } from '@/lib/db';
import { Innertube } from 'youtubei.js';

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

    // 2. Cache miss: Récupère la transcription de YouTube
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return Response.json({ error: 'Aucune transcription disponible pour cette vidéo.' }, { status: 404 });
    }

    const transcript = transcriptItems.map((item) => item.text).join(' ');

    // 3. Cache miss: Récupère les métadonnées de la vidéo via youtubei.js
    let title = 'Vidéo sans titre';
    let description = '';
    let thumbnail = '';
    let author = '';
    let duration = 0;

    try {
      const yt = await Innertube.create();
      const info = await yt.getInfo(videoId);
      const basicInfo = info.basic_info;
      title = basicInfo?.title || title;
      description = basicInfo?.short_description || description;
      thumbnail = basicInfo?.thumbnail?.[0]?.url || thumbnail;
      author = basicInfo?.author || author;
      duration = basicInfo?.duration || duration;
    } catch (metadataError) {
      console.warn(`[Metadata] Échec de la récupération des métadonnées pour "${videoId}":`, metadataError);
    }

    // 4. Enregistrer la vidéo et les segments dans la base de données PostgreSQL
    await prisma.video.create({
      data: {
        id: videoId,
        title,
        description,
        thumbnail,
        author,
        duration,
        transcript,
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

    // 5. Indexation dans Pinecone pour le RAG lancée en arrière-plan pour ne pas bloquer l'utilisateur
    const indexPineconeBackground = async () => {
      try {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        // Regrouper les lignes courtes en blocs de ~1000 caractères pour optimiser les requêtes d'embeddings
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
        console.log(`[Pinecone] ${splits.length} segments indexés dans le namespace "${videoId}" (arrière-plan terminé)`);
      } catch (pineconeError: any) {
        console.error("Erreur lors de l'indexation Pinecone en arrière-plan:", pineconeError);
      }
    };

    // Lancer en arrière-plan
    indexPineconeBackground();

    // Retourne les segments avec timestamps + le texte concaténé pour le chat
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
