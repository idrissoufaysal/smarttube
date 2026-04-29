import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
  try {
    console.log("transciption video")
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Une URL YouTube est requise' },
        { status: 400 }
      );
    }

    // Extraction de l'ID vidéo à partir de différents formats d'URL YouTube
    const videoIdMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/
    );

    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      return NextResponse.json(
        { error: 'URL YouTube invalide. Impossible de trouver l\'ID de la vidéo.' },
        { status: 400 }
      );
    }

    // Récupération de la transcription
    const transcriptLines = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'fr' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId)); // Fallback sans langue si 'fr' échoue

    if (!transcriptLines || transcriptLines.length === 0) {
      return NextResponse.json(
        { error: 'Aucun sous-titre trouvé pour cette vidéo.' },
        { status: 404 }
      );
    }

    // Concaténer le texte
    const fullText = transcriptLines.map((t) => t.text).join(' ');

    return NextResponse.json({
      videoId,
      transcript: fullText,
      lines: transcriptLines, // Optionnel, si on a besoin des timestamps côté client
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'extraction de la vidéo:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'extraction des sous-titres.' },
      { status: 500 }
    );
  }
}
