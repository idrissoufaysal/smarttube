import { YoutubeTranscript } from 'youtube-transcript';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getVectorStore } from '@/lib/pinecone';
import { Document } from '@langchain/core/documents';

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

    // Récupère la transcription
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return Response.json({ error: 'Aucune transcription disponible pour cette vidéo.' }, { status: 404 });
    }

    // Indexation dans Pinecone pour le RAG
    let pineconeIndexed = false;
    let pineconeErrorMsg = '';

    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const documents = transcriptItems.map((item) => {
        return new Document({
          pageContent: item.text,
          metadata: {
            videoId,
            start: item.offset,
            duration: item.duration,
          },
        });
      });

      const splits = await splitter.splitDocuments(documents);

      const vectorStore = await getVectorStore(videoId);
      await vectorStore.addDocuments(splits);
      console.log(`[Pinecone] ${splits.length} segments indexés dans le namespace "${videoId}"`);
      pineconeIndexed = true;
    } catch (pineconeError: any) {
      console.error("Erreur lors de l'indexation Pinecone:", pineconeError);
      pineconeErrorMsg = pineconeError.message || "Erreur de configuration Pinecone.";
    }

    // Retourne les segments avec timestamps + le texte concaténé pour le chat
    const transcript = transcriptItems.map((item) => item.text).join(' ');

    return Response.json({
      transcript,
      pineconeIndexed,
      pineconeError: pineconeErrorMsg,
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
