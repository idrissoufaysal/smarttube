import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Autoriser le streaming de la réponse jusqu'à 30 secondes
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, transcript }: { messages: UIMessage[]; transcript?: string } = await req.json();

    const systemPrompt = transcript
      ? `Tu es un assistant vidéo pédagogique et intelligent appelé SmartTube.
Ton rôle est d'aider l'utilisateur à comprendre la vidéo dont voici la transcription complète :

<transcription>
${transcript}
</transcription>

Réponds toujours de manière claire, concise et pédagogique en te basant sur cette transcription.
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
