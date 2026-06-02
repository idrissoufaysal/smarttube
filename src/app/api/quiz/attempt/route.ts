import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { videoId, quizId, score, total, difficulty, userId } = await req.json();

    if (!videoId || !quizId || score === undefined || total === undefined || !difficulty) {
      return Response.json({ error: 'Champs requis manquants.' }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        videoId,
        quizId,
        score: parseInt(score, 10),
        total: parseInt(total, 10),
        difficulty,
        userId: userId || null,
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
    const userId = searchParams.get('userId');

    if (!videoId) {
      return Response.json({ error: 'videoId est requis.' }, { status: 400 });
    }

    // Récupérer les tentatives. Si userId est fourni, on filtre par celui-ci, 
    // sinon on récupère toutes les tentatives pour cette vidéo (mode anonyme ou global)
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        videoId,
        OR: userId ? [{ userId }, { userId: null }] : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Récupère les 10 dernières tentatives
    });

    return Response.json({ attempts });
  } catch (error: any) {
    console.error('Erreur récupération tentatives:', error);
    return Response.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
