'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChatInterface } from '@/components/chat-interface';
import type { MediaPlayerInstance } from '@vidstack/react';
import { useCompletion } from '@ai-sdk/react';
import { 
  Search, 
  BookOpen, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  FileText 
} from 'lucide-react';

import { QuizInterface } from '@/components/quiz-interface';
import { UrlModal } from '@/components/url-modal';

const VideoPlayer = dynamic(() => import('@/components/video-player'), { ssr: false });

interface SegmentItem {
  text: string;
  start: number;
  duration: number;
}

interface VideoInfo {
  title: string;
  description: string;
  author: string;
  viewCount: number;
  publishDate: string;
  duration: number;
  notes?: string | null;
  transcript?: string;
  segments?: SegmentItem[];
}

function StudyContent() {
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

  // Rendu Markdown ultra-basique sécurisé pour l'affichage des notes
  const parseMarkdown = (text: string) => {
    const renderInlineStyles = (lineText: string) => {
      const parts = lineText.split(/\*\*([^*]+)\*\*/g);
      return parts.map((part, idx) => {
        if (idx % 2 === 1) {
          return <strong key={idx} className="font-extrabold text-[#ffb4a8]">{part}</strong>;
        }
        return part;
      });
    };

    return text.split('\n').map((line, idx) => {
      const content = line.trim();
      if (!content) return <div key={idx} className="h-2" />;

      if (content.startsWith('### ')) {
        return <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2">{renderInlineStyles(content.replace('### ', ''))}</h4>;
      }
      if (content.startsWith('## ')) {
        return <h3 key={idx} className="text-lg font-bold text-[#ffb4a8] mt-5 mb-2">{renderInlineStyles(content.replace('## ', ''))}</h3>;
      }
      if (content.startsWith('# ')) {
        return <h2 key={idx} className="text-xl font-bold text-white mt-6 mb-3">{renderInlineStyles(content.replace('# ', ''))}</h2>;
      }

      if (content.startsWith('- ') || content.startsWith('* ')) {
        const cleanText = content.substring(2);
        return (
          <li key={idx} className="list-disc ml-5 text-sm text-[#ebbbb4] mb-1">
            {renderInlineStyles(cleanText)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-sm text-[#ebbbb4] mb-3 leading-relaxed">
          {renderInlineStyles(content)}
        </p>
      );
    });
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
        {/* Colonne Gauche : Lecteur Vidéo + Module d'onglets (Transcription & Notes) */}
        <div className="col-span-2 space-y-6">
          <div className="bg-[#0e0e0e] rounded-lg overflow-hidden aspect-video relative">
            {url && isMounted ? (
              <div className="absolute inset-0 w-full h-full">
                <VideoPlayer
                  playerRef={playerRef}
                  url={url}
                  onTimeUpdate={(time) => setCurrentTime(time)}
                />
              </div>
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
              <div className="flex gap-2 items-center">
                <span className="bg-[#353534] text-[#ffb4a8] px-3 py-1 rounded text-xs font-semibold">AI/ML</span>
                {maxScore && (
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-md text-xs font-extrabold flex items-center gap-1 animate-fade-in">
                    🏆 Score Max: {maxScore}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Module d'onglets dynamique sous la vidéo */}
          <div className="bg-[#201f1f] rounded-xl border border-[#353534] overflow-hidden shadow-xl">
            {/* Barre d'onglets */}
            <div className="flex border-b border-[#353534] bg-[#1a1919] p-2 gap-2">
              <button
                onClick={() => setStudyTab('transcript')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  studyTab === 'transcript'
                    ? 'bg-[#ffb4a8]/10 text-[#ffb4a8] border border-[#ffb4a8]/25'
                    : 'text-[#ebbbb4]/40 hover:text-[#ebbbb4]/80 hover:bg-white/5 border border-transparent'
                }`}
              >
                <FileText className="h-4 w-4" />
                Transcription
              </button>
              <button
                onClick={() => setStudyTab('notes')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  studyTab === 'notes'
                    ? 'bg-[#ffb4a8]/10 text-[#ffb4a8] border border-[#ffb4a8]/25'
                    : 'text-[#ebbbb4]/40 hover:text-[#ebbbb4]/80 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Sparkles className="h-4 w-4 text-[#ffb4a8]" />
                Notes de cours (IA)
              </button>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {studyTab === 'transcript' ? (
                // Onglet Transcription
                <div className="space-y-4">
                  {/* Actions de la transcription style YouTube */}
                  <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[#353534]/40 pb-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ebbbb4]/40" />
                      <input
                        type="text"
                        placeholder="Rechercher des mots-clés dans la transcription..."
                        className="w-full bg-[#181717] border border-[#353534] rounded-lg pl-11 pr-4 py-2.5 text-sm text-[#ebbbb4] placeholder:text-[#ebbbb4]/30 focus:outline-none focus:border-[#ffb4a8]/50 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTimestamps(!showTimestamps)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                          showTimestamps
                            ? 'bg-[#ffb4a8]/10 text-[#ffb4a8] border-[#ffb4a8]/20'
                            : 'bg-[#181717] text-[#ebbbb4]/80 border-[#353534] hover:bg-[#ffb4a8]/10 hover:text-[#ffb4a8]'
                        }`}
                        title={showTimestamps ? "Masquer les timestamps" : "Afficher les timestamps"}
                      >
                        ⏱️ Timestamps
                      </button>
                      <button
                        onClick={handleExportTranscriptPDF}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#ffb4a8] text-[#603e39] hover:brightness-110 transition-all shadow-md shadow-[#ffb4a8]/10"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Exporter en PDF
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {filteredSegments.length > 0 ? (
                      filteredSegments.map((seg, idx) => {
                        const isActive =
                          currentTime >= seg.start &&
                          currentTime < seg.start + (seg.duration || 5);
                        return (
                          <div
                            key={idx}
                            ref={isActive ? activeSegmentRef : null}
                            className={`flex gap-4 p-3 rounded-lg transition-all border ${
                              isActive
                                ? 'bg-[#ffb4a8]/10 border-[#ffb4a8]/20 shadow-md shadow-primary/5'
                                : 'bg-transparent border-transparent hover:bg-[#181717]/50'
                            }`}
                          >
                            {showTimestamps && (
                              <button
                                onClick={() => handleTimelineClick(seg.start)}
                                className={`h-fit px-2.5 py-1 rounded-md text-xs font-bold font-mono transition-colors shrink-0 ${
                                  isActive
                                    ? 'bg-[#ffb4a8] text-[#603e39] shadow-lg shadow-[#ffb4a8]/20'
                                    : 'bg-[#181717] text-[#ffb4a8] hover:bg-[#ffb4a8]/25 hover:text-[#ffb4a8]'
                                }`}
                              >
                                {formatTime(seg.start)}
                              </button>
                            )}
                            <p
                              onClick={() => handleTimelineClick(seg.start)}
                              className={`text-sm cursor-pointer transition-colors leading-relaxed flex-1 ${
                                isActive ? 'text-white font-medium' : 'text-[#ebbbb4]/80 hover:text-white'
                              }`}
                            >
                              {seg.text}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-sm text-[#ebbbb4]/40 py-8">Aucun segment ne correspond à votre recherche.</p>
                    )}
                  </div>
                </div>
              ) : (
                // Onglet Notes (Exclusivité de l'écran de chargement pendant la génération)
                <div className="space-y-4">
                  {isGenerating ? (
                    // Écran de chargement exclusif durant la génération
                    <div className="flex flex-col items-center justify-center py-12 px-6 bg-[#181717] rounded-xl border border-[#353534]/50 space-y-4 animate-fade-in">
                      <div className="h-16 w-16 rounded-full bg-[#ffb4a8]/10 border border-[#ffb4a8]/25 flex items-center justify-center animate-spin">
                        <RefreshCw className="h-8 w-8 text-[#ffb4a8]" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Génération en cours...</h3>
                      <p className="text-sm text-center text-[#ebbbb4]/60 max-w-sm">
                        L'IA analyse le cours et structure votre synthèse. Veuillez patienter un instant.
                      </p>
                      <div className="h-1.5 w-full max-w-md bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#ffb4a8] rounded-full animate-pulse" style={{ width: '75%' }} />
                      </div>
                    </div>
                  ) : notes ? (
                    // Affichage des notes terminées avec option d'export PDF
                    <div className="space-y-4 animate-fade-in">
                      {/* Actions sur les notes */}
                      <div className="flex items-center justify-between border-b border-[#353534] pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-[#ffb4a8]" />
                          <span className="text-sm font-semibold text-white">Synthèse et concepts clés de la vidéo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyNotes}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#181717] text-[#ebbbb4]/80 hover:bg-[#ffb4a8]/10 hover:text-[#ffb4a8] transition-all border border-[#353534]"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-green-400" />
                                Copié !
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copier
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleExportNotesPDF}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#ffb4a8] text-[#603e39] hover:brightness-110 transition-all shadow-md shadow-[#ffb4a8]/10"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Exporter en PDF
                          </button>
                          <button
                            onClick={handleExportNotes}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#181717] text-[#ebbbb4]/80 hover:bg-[#ffb4a8]/10 hover:text-[#ffb4a8] transition-all border border-[#353534]"
                          >
                            Exporter (.md)
                          </button>
                          <button
                            onClick={() => handleGenerateNotes(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#181717] text-[#ebbbb4]/80 hover:bg-[#ffb4a8]/10 hover:text-[#ffb4a8] transition-all border border-[#353534]"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Régénérer
                          </button>
                        </div>
                      </div>

                      {/* Contenu des notes */}
                      <div className="max-h-[400px] overflow-y-auto pr-2 text-[#ebbbb4] prose prose-invert max-w-none">
                        {parseMarkdown(notes)}
                      </div>
                    </div>
                  ) : (
                    // Écran d'accueil de génération
                    <div className="flex flex-col items-center justify-center py-12 px-6 bg-[#181717] rounded-xl border border-[#353534]/50">
                      <div className="h-16 w-16 rounded-full bg-[#ffb4a8]/10 border border-[#ffb4a8]/20 flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-[#ffb4a8]" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Générateur de Notes de Cours IA</h3>
                      <p className="text-sm text-center text-[#ebbbb4]/60 max-w-md mb-6 leading-relaxed">
                        Laissez notre IA analyser la transcription de cette vidéo pour rédiger automatiquement une synthèse structurée, claire et exploitable pour vos révisions.
                      </p>
                      <button
                        onClick={() => handleGenerateNotes(false)}
                        className="flex items-center gap-2 bg-[#ffb4a8] text-[#603e39] px-6 py-3 rounded-lg font-bold hover:brightness-110 transition-all shadow-lg shadow-[#ffb4a8]/10"
                      >
                        <Sparkles className="h-4 w-4" />
                        Générer les notes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne Droite : AI Chat / Quiz sticky */}
        <div className="space-y-6 sticky top-20 h-[calc(100vh-90px)] flex flex-col">
          <div className="border-b border-[#353534] flex gap-0 shrink-0">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'ai'
                  ? 'text-[#ffb4a8] border-[#ffb4a8]'
                  : 'text-[#603e39] border-transparent hover:text-[#ebbbb4]'
              }`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'practice'
                  ? 'text-[#ffb4a8] border-[#ffb4a8]'
                  : 'text-[#603e39] border-transparent hover:text-[#ebbbb4]'
              }`}
            >
              Practice Questions
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'ai' ? (
              transcript ? (
                <ChatInterface
                  transcript={transcript}
                  url={url}
                  onTimelineClick={handleTimelineClick}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant space-y-4">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm">Chargement de la transcription...</p>
                </div>
              )
            ) : (
              <QuizInterface transcript={transcript} videoId={videoId} />
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
