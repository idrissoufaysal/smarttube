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

    // Crée une instance YouTube
    const yt = await Innertube.create();

    // Récupère les infos de la vidéo
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
