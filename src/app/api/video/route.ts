import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId requis' }, { status: 400 });
    }

    // Suppression en cascade (segments, quiz, attempts, messages)
    // Prisma cascade delete si défini dans le schéma, sinon on supprime manuellement
    await prisma.video.delete({
      where: { id: videoId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression vidéo:', error);
    // P2025 = record not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
