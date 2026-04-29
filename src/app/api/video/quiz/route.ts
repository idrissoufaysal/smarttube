import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Le schéma Zod définit exactement la structure de données que Gemini doit retourner.
// Cela garantit que le client recevra un JSON formaté correctement.
const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("La question à poser."),
      options: z.array(z.string()).length(4).describe("4 options de réponse possibles."),
      correctAnswerIndex: z.number().min(0).max(3).describe("L'index (de 0 à 3) de la bonne réponse parmi les options."),
      explanation: z.string().describe("Une brève explication du pourquoi c'est la bonne réponse.")
    })
  )
});

export const maxDuration = 60; // Autoriser jusqu'à 60 secondes car la génération structurée peut prendre du temps

export async function POST(req: Request) {
  try {
        console.log("transciption video")

    const { transcript, difficulty = 'moyen', numberOfQuestions = 5 } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'La transcription est requise' }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: quizSchema,
      prompt: `Tu es un professeur expert. Génère un QCM (Quiz) à choix multiples basé EXCLUSIVEMENT sur la transcription vidéo suivante :

<transcription>
${transcript}
</transcription>

Instructions :
- Génère exactement ${numberOfQuestions} questions.
- Le niveau de difficulté doit être : ${difficulty}.
- Les questions, options et explications doivent IMPÉRATIVEMENT être en français.
- Ne pose pas de questions sur des choses qui ne sont pas dites dans la transcription.`,
    });

    // Retourner l'objet structuré validé
    return NextResponse.json({ quiz: object });
    
  } catch (error: any) {
    console.error('Erreur Génération Quiz:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération du quiz.' },
      { status: 500 }
    );
  }
}
