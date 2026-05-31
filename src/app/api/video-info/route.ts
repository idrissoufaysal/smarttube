import { prisma } from '@/lib/db';
import { Innertube } from 'youtubei.js';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL YouTube requise.' }, { status: 400 });
    }

    // Extrait l'ID vidéo
    const videoId = extractVideoId(url);
    if (!videoId) {
      return Response.json({ error: 'URL YouTube invalide.' }, { status: 400 });
    }

    // 1. Tenter de récupérer la vidéo depuis le cache PostgreSQL
    const cachedVideo = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (cachedVideo) {
      console.log(`[Cache] Métadonnées de la vidéo "${videoId}" récupérées depuis PostgreSQL.`);
      return Response.json({
        title: cachedVideo.title,
        description: cachedVideo.description || '',
        thumbnail: cachedVideo.thumbnail || '',
        author: cachedVideo.author || '',
        viewCount: 0, // Optionnel, fallback
        publishDate: '', // Optionnel, fallback
        duration: cachedVideo.duration,
      });
    }

    // 2. Cache miss: Crée une instance YouTube et extrait les informations en ligne
    const yt = await Innertube.create();
    const info = await yt.getInfo(videoId);
    const basicInfo = info.basic_info;

    return Response.json({
      title: basicInfo?.title || 'Vidéo sans titre',
      description: basicInfo?.short_description || '',
      thumbnail: basicInfo?.thumbnail?.[0]?.url || '',
      author: basicInfo?.author || '',
      viewCount: basicInfo?.view_count || 0,
      publishDate: (basicInfo as any)?.publish_date || '',
      duration: basicInfo?.duration || 0,
    });
  } catch (error) {
    console.error('Erreur video-info:', error);
    return Response.json({ error: 'Impossible de récupérer les informations de la vidéo.' }, { status: 500 });
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
