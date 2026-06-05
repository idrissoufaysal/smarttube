import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { videoId, quizId, score, total, difficulty } = await req.json();

    if (!videoId || !quizId || score === undefined || total === undefined || !difficulty) {
      return Response.json({ error: 'Champs requis manquants.' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté (peut être null si pas connecté)
    const currentUserRecord = await getCurrentUser();

    const attempt = await prisma.quizAttempt.create({
      data: {
        videoId,
        quizId,
        score: parseInt(score, 10),
        total: parseInt(total, 10),
        difficulty,
        userId: currentUserRecord?.id ?? null,
      },
    });

    return Response.json({ success: true, attempt });
  } catch (error: any) {
    console.error('Erreur enregistrement tentative:', error);
    return Response.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return Response.json({ error: 'videoId est requis.' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté pour filtrer ses tentatives
    const currentUserRecord = await getCurrentUser();

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        videoId,
        // Si connecté, montrer les tentatives de l'utilisateur + anonymes
        // Si non connecté, montrer uniquement les anonymes
        OR: currentUserRecord
          ? [{ userId: currentUserRecord.id }, { userId: null }]
          : [{ userId: null }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return Response.json({ attempts });
  } catch (error: any) {
    console.error('Erreur récupération tentatives:', error);
    return Response.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
