import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// Autoriser le streaming de la réponse jusqu'à 30 secondes
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, transcript } = await req.json();

    if (!messages) {
      return new Response('Les messages sont requis', { status: 400 });
    }

    // Si on a un transcript, on l'ajoute comme instruction système pour donner du contexte au modèle
    const systemPrompt = transcript
      ? `Tu es un assistant vidéo pédagogique et intelligent appelé SmartTube.
Ton rôle est d'aider l'utilisateur à comprendre la vidéo dont voici la transcription complète :

<transcription>
${transcript}
</transcription>

Réponds toujours de manière claire, concise et pédagogique en te basant sur cette transcription.
Tes réponses doivent IMPÉRATIVEMENT être en français.`
      : `Tu es un assistant vidéo pédagogique et intelligent appelé SmartTube. Tes réponses doivent IMPÉRATIVEMENT être en français.`;

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const result = streamText({
      model: google('gemini-1.5-flash'), // Utilisation de Gemini 1.5 Flash (très rapide et gros contexte)
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Erreur Chatbot Gemini:', error);
    return new Response('Erreur interne du serveur', { status: 500 });
  }
}
