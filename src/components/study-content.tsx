'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCompletion } from '@ai-sdk/react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { UrlModal } from '@/components/url-modal';
import { StudyLeftPanel } from './study/study-left-panel';
import { StudyRightPanel } from './study/study-right-panel';
import { SegmentItem, VideoInfo } from './study/types';

export function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';
  const videoId = url ? extractVideoId(url) || undefined : undefined;

  // États principaux
  const [activeTab, setActiveTab] = useState('ai'); // AI Assistant vs Quiz
  const [studyTab, setStudyTab] = useState<'transcript' | 'notes'>('transcript'); // Transcription vs Notes (Transcription par défaut)
  
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [notes, setNotes] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [maxScore, setMaxScore] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true); // Gérer l'affichage des timestamps

  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  // Hook Vercel AI SDK pour streamer les notes
  const { completion, complete, isLoading: isGenerating, setCompletion } = useCompletion({
    api: '/api/video/notes',
    body: {
      videoId,
      transcript,
    },
    onFinish: (_, resultText) => {
      setNotes(resultText);
    },
  });

  const handleTimelineClick = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.remoteControl.seek(seconds);
    }
  };

  const fetchQuizStats = async () => {
    if (!videoId) return;
    try {
      const res = await fetch(`/api/quiz/attempt?videoId=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        const attempts = data.attempts || [];
        if (attempts.length > 0) {
          let maxPct = 0;
          let bestAttempt = attempts[0];
          attempts.forEach((att: any) => {
            const pct = (att.score / att.total) * 100;
            if (pct > maxPct) {
              maxPct = pct;
              bestAttempt = att;
            }
          });
          setMaxScore(`${bestAttempt.score}/${bestAttempt.total}`);
        } else {
          setMaxScore(null);
        }
      }
    } catch (err) {
      console.error('Erreur stats quiz:', err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    // Charger initialement depuis sessionStorage si disponible
    const storedTranscript = sessionStorage.getItem('smarttube_transcript');
    if (storedTranscript) setTranscript(storedTranscript);

    const storedSegments = sessionStorage.getItem('smarttube_segments');
    if (storedSegments) {
      try {
        setSegments(JSON.parse(storedSegments));
      } catch (e) {
        console.error('Erreur parsing segments sessionStorage:', e);
      }
    }

    if (url) {
      extractVideoTitle(url);
    }
  }, [url]);

  useEffect(() => {
    if (videoId) {
      fetchQuizStats();
    }
  }, [videoId, activeTab]);

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

        // Charger depuis le cache serveur si présent (permet le deep-linking direct)
        if (data.notes) {
          setNotes(data.notes);
        }
        if (data.transcript) {
          setTranscript(data.transcript);
        }
        if (data.segments) {
          setSegments(data.segments);
        }
      }
    } catch (err) {
      console.error("Erreur chargement métadonnées:", err);
    } finally {
      setLoading(false);
    }
  }

  // Déclencher la génération des notes par IA
  const handleGenerateNotes = async (forceRegenerate = false) => {
    if (notes && !forceRegenerate) return;
    try {
      setNotes(null);
      setCompletion('');
      await complete('', {
        body: {
          videoId,
          transcript,
          regenerate: forceRegenerate,
        }
      });
    } catch (err) {
      console.error("Erreur lors de la génération des notes:", err);
    }
  };

  // Copier les notes dans le presse-papiers
  const handleCopyNotes = async () => {
    if (!notes) return;
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie des notes:', err);
    }
  };

  // Exporter les notes au format Markdown (.md)
  const handleExportNotes = () => {
    if (!notes) return;
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (videoInfo?.title || 'notes').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.setAttribute('download', `notes-${safeTitle}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utilitaire d'export PDF par impression de fenêtre temporaire
  const exportToPDF = (title: string, contentHtml: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              color: #1a1a1a;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-size: 24px;
              color: #0b0b0d;
              border-bottom: 2px solid #eaeaea;
              padding-bottom: 10px;
              margin-bottom: 20px;
              font-weight: 700;
            }
            .metadata {
              font-size: 14px;
              color: #666;
              margin-bottom: 30px;
            }
            .segment {
              margin-bottom: 12px;
              display: flex;
              gap: 15px;
              align-items: flex-start;
            }
            .timestamp {
              font-family: monospace;
              font-weight: bold;
              color: #ff5a36;
              background: #fff0eb;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 13px;
              flex-shrink: 0;
            }
            .text {
              font-size: 14px;
            }
            .notes-content {
              font-size: 15px;
            }
            h2 {
              font-size: 20px;
              color: #0b0b0d;
              border-bottom: 1px solid #eee;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            h3 {
              font-size: 17px;
              color: #0b0b0d;
              margin-top: 25px;
              margin-bottom: 10px;
            }
            h4 {
              font-size: 15px;
              color: #333;
              margin-top: 20px;
              margin-bottom: 8px;
            }
            p {
              margin-top: 0;
              margin-bottom: 12px;
            }
            li {
              margin-bottom: 6px;
            }
            strong {
              color: #ff5a36;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="metadata">Généré le ${new Date().toLocaleDateString('fr-FR')} par SmartTube</div>
          <div class="content">
            ${contentHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Convertisseur Markdown basique en HTML pour l'export PDF
  const convertMarkdownToHtml = (markdownText: string) => {
    const parseInlineHtml = (lineText: string) => {
      return lineText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    };

    return markdownText.split('\n').map(line => {
      const content = line.trim();
      if (!content) return '<br/>';

      if (content.startsWith('### ')) {
        return `<h4>${parseInlineHtml(content.replace('### ', ''))}</h4>`;
      }
      if (content.startsWith('## ')) {
        return `<h3>${parseInlineHtml(content.replace('## ', ''))}</h3>`;
      }
      if (content.startsWith('# ')) {
        return `<h2>${parseInlineHtml(content.replace('# ', ''))}</h2>`;
      }

      if (content.startsWith('- ') || content.startsWith('* ')) {
        const cleanText = content.substring(2);
        return `<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 6px;">${parseInlineHtml(cleanText)}</li>`;
      }

      return `<p style="margin-bottom: 12px; line-height: 1.6;">${parseInlineHtml(content)}</p>`;
    }).join('');
  };

  // Exporter la transcription au format PDF
  const handleExportTranscriptPDF = () => {
    const contentHtml = segments.map(seg => `
      <div class="segment">
        ${showTimestamps ? `<span class="timestamp">${formatTime(seg.start)}</span>` : ''}
        <span class="text">${seg.text}</span>
      </div>
    `).join('');
    
    exportToPDF(`Transcription - ${videoInfo?.title || 'Vidéo'}`, contentHtml);
  };

  // Exporter les notes de cours au format PDF
  const handleExportNotesPDF = () => {
    if (!notes) return;
    const contentHtml = `
      <div class="notes-content">
        ${convertMarkdownToHtml(notes)}
      </div>
    `;
    exportToPDF(`Notes de Cours - ${videoInfo?.title || 'Vidéo'}`, contentHtml);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Filtrer les segments de transcription par terme de recherche
  const filteredSegments = segments.filter((seg) =>
    seg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0b0d] pb-12">
      <div className="grid grid-cols-3 gap-6 p-6 max-w-7xl mx-auto relative">
        {/* Panneau Gauche : Lecteur Vidéo + Titre + Transcription/Notes */}
        <StudyLeftPanel
          url={url}
          isMounted={isMounted}
          playerRef={playerRef}
          onTimeUpdate={(time) => setCurrentTime(time)}
          videoInfo={videoInfo}
          maxScore={maxScore}
          studyTab={studyTab}
          setStudyTab={setStudyTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showTimestamps={showTimestamps}
          setShowTimestamps={setShowTimestamps}
          currentTime={currentTime}
          filteredSegments={filteredSegments}
          handleTimelineClick={handleTimelineClick}
          handleExportTranscriptPDF={handleExportTranscriptPDF}
          activeSegmentRef={activeSegmentRef}
          isGenerating={isGenerating}
          notes={notes}
          copied={copied}
          handleCopyNotes={handleCopyNotes}
          handleExportNotesPDF={handleExportNotesPDF}
          handleExportNotes={handleExportNotes}
          handleGenerateNotes={handleGenerateNotes}
        />

        {/* Panneau Droit : Chat Assist & Quiz */}
        <StudyRightPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          transcript={transcript}
          url={url}
          videoId={videoId}
          handleTimelineClick={handleTimelineClick}
        />
      </div>
    </div>
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
