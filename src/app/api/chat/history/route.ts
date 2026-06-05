import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Récupérer l'utilisateur connecté pour filtrer ses messages
    const userId = await getCurrentUserId();

    const messages = await prisma.chatMessage.findMany({
      where: {
        videoId,
        // Si connecté, montrer ses messages + anonymes. Sinon juste anonymes.
        OR: userId
          ? [{ userId }, { userId: null }]
          : [{ userId: null }],
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
