import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getPineconeIndex } from '@/lib/pinecone';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur est connecté
    const currentUserRecord = await getCurrentUser();
    if (!currentUserRecord) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est propriétaire de la vidéo
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { userId: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
    }

    if (video.userId && video.userId !== currentUserRecord.id) {
      return NextResponse.json({ error: 'Non autorisé à supprimer cette vidéo' }, { status: 403 });
    }

    // Suppression des vecteurs dans Pinecone
    try {
      await getPineconeIndex().namespace(videoId).deleteAll();
    } catch (pineconeError) {
      console.error('Erreur suppression Pinecone:', pineconeError);
    }

    // Suppression en cascade (segments, quiz, attempts, messages)
    await prisma.video.delete({
      where: { id: videoId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression vidéo:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
