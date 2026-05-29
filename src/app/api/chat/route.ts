import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { getVectorStore } from '@/lib/pinecone';

// Autoriser le streaming de la réponse jusqu'à 30 secondes
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, transcript, videoId }: { messages: UIMessage[]; transcript?: string; videoId?: string } = await req.json();

    let context = '';
    let usingRAG = false;

    // Tentative de récupération contextuelle RAG via Pinecone
    if (videoId) {
      try {
        const userMessages = messages.filter((m) => m.role === 'user');
        const latestUserQuery = userMessages[userMessages.length - 1]?.content || '';

        if (latestUserQuery) {
          const vectorStore = await getVectorStore(videoId);
          const results = await vectorStore.similaritySearch(latestUserQuery, 4);
          context = results.map((doc) => doc.pageContent).join('\n\n');
          usingRAG = true;
          console.log(`[RAG] ${results.length} segments pertinents récupérés de Pinecone pour la vidéo "${videoId}".`);
        }
      } catch (ragError) {
        console.warn("[RAG] Échec de la recherche vectorielle, repli sur la transcription complète :", ragError);
      }
    }

    // Repli (fallback) sur la transcription complète
    if (!context && transcript) {
      context = transcript;
    }

    const systemPrompt = context
      ? `Tu es un assistant vidéo pédagogique et intelligent appelé SmartTube.
Ton rôle est d'aider l'utilisateur à comprendre la vidéo en te basant sur ${usingRAG ? "les extraits pertinents suivants de sa transcription" : "sa transcription complète"} :

<contexte_video>
${context}
</contexte_video>

Réponds toujours de manière claire, concise et pédagogique en te basant sur ce contexte.
Tes réponses doivent IMPÉRATIVEMENT être en français.`
      : `Tu es un assistant vidéo pédagogique et intelligent appelé SmartTube. Tes réponses doivent IMPÉRATIVEMENT être en français.`;

    const openrouter = createOpenRouter({
      apiKey: process.env.AI_KEY,
    });

    const result = streamText({
      model: openrouter.chat('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Erreur Chatbot OpenRouter:', error);
    return new Response('Erreur interne du serveur', { status: 500 });
  }
}
