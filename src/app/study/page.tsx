'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat-interface';
import { QuizInterface } from '@/components/quiz-interface';
import { UrlModal } from '@/components/url-modal';

interface VideoInfo {
  title: string;
  description: string;
  author: string;
  viewCount: number;
  publishDate: string;
  duration: number;
}

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';

  const [activeTab, setActiveTab] = useState('ai');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('smarttube_transcript');
    if (stored) setTranscript(stored);

    if (url) {
      extractVideoTitle(url);
    }
  }, [url]);

  async function extractVideoTitle(videoUrl: string) {
    try {
      const res = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideoInfo({
          title: data.title,
          description: data.description,
          author: data.author,
          viewCount: data.viewCount,
          publishDate: data.publishDate,
          duration: data.duration,
        });
      }
    } catch {
      // Fallback si l'API échoue
    } finally {
      setLoading(false);
    }
  }

  if (!url) {
    return <UrlModal onSuccess={(newUrl, newTranscript) => setTranscript(newTranscript)} />;
  }

  if (!transcript && !loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0d] flex items-center justify-center">
        <p className="text-white/50">Aucune transcription disponible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d]">
      <div className="grid grid-cols-3 gap-6 p-6 max-w-7xl mx-auto relative">
        <div className="col-span-2 space-y-6">
          <div className="bg-[#0e0e0e] rounded-lg overflow-hidden aspect-video relative">
            {url ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${extractVideoId(url)}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-[#2a5a8a] to-[#0e0e0e] opacity-20" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-3">
              {videoInfo?.title || 'Vidéo en cours de chargement...'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#ebbbb4]">
              <span> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <div className="flex gap-2">
                <span className="bg-[#353534] text-[#ffb4a8] px-3 py-1 rounded text-xs font-semibold">AI/ML</span>
              </div>
            </div>
          </div>

          <div className="bg-[#201f1f] rounded-lg p-6 border border-[#353534]">
            <h2 className="text-sm font-bold text-[#ffb4a8] mb-4 uppercase tracking-wider">
              Key Takeaways
            </h2>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-[#ebbbb4]">
                <span className="text-[#ffb4a8] font-bold">•</span>
                <span>Backpropagation is the engine of gradient descent.</span>
              </li>
              <li className="flex gap-3 text-sm text-[#ebbbb4]">
                <span className="text-[#ffb4a8] font-bold">•</span>
                <span>Activation functions introduce non-linearity into the model.</span>
              </li>
              <li className="flex gap-3 text-sm text-[#ebbbb4]">
                <span className="text-[#ffb4a8] font-bold">•</span>
                <span>Architecture depth vs. width: finding the balance.</span>
              </li>
            </ul>
          </div>
        </div>


        <div className="space-y-6 sticky top-20 h-[calc(100vh-90px)] flex flex-col">
          <div className="border-b border-[#353534] flex gap-0 shrink-0">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition ${activeTab === 'ai'
                ? 'text-[#ffb4a8] border-[#ffb4a8]'
                : 'text-[#603e39] border-transparent hover:text-[#ebbbb4]'
                }`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition ${activeTab === 'practice'
                ? 'text-[#ffb4a8] border-[#ffb4a8]'
                : 'text-[#603e39] border-transparent hover:text-[#ebbbb4]'
                }`}
            >
              Practice Questions
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'ai' ? (
              <ChatInterface transcript={transcript} url={url} />
            ) : (
              <QuizInterface transcript={transcript} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0d] flex items-center justify-center">
        <p className="text-white/50">Chargement...</p>
      </div>
    }>
      <StudyContent />
    </Suspense>
  );
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
