'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { MediaPlayerInstance } from '@vidstack/react';
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
import { SegmentItem, VideoInfo } from './types';

const VideoPlayer = dynamic(() => import('@/components/video-player'), { ssr: false });

export interface StudyLeftPanelProps {
  url: string;
  isMounted: boolean;
  playerRef: React.MutableRefObject<MediaPlayerInstance | null>;
  onTimeUpdate: (time: number) => void;
  videoInfo: VideoInfo | null;
  maxScore: string | null;
  studyTab: 'transcript' | 'notes';
  setStudyTab: (tab: 'transcript' | 'notes') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showTimestamps: boolean;
  setShowTimestamps: (show: boolean) => void;
  currentTime: number;
  filteredSegments: SegmentItem[];
  handleTimelineClick: (seconds: number) => void;
  handleExportTranscriptPDF: () => void;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
  isGenerating: boolean;
  notes: string | null;
  copied: boolean;
  handleCopyNotes: () => void;
  handleExportNotesPDF: () => void;
  handleExportNotes: () => void;
  handleGenerateNotes: (force?: boolean) => void;
}

export function StudyLeftPanel({
  url,
  isMounted,
  playerRef,
  onTimeUpdate,
  videoInfo,
  maxScore,
  studyTab,
  setStudyTab,
  searchTerm,
  setSearchTerm,
  showTimestamps,
  setShowTimestamps,
  currentTime,
  filteredSegments,
  handleTimelineClick,
  handleExportTranscriptPDF,
  activeSegmentRef,
  isGenerating,
  notes,
  copied,
  handleCopyNotes,
  handleExportNotesPDF,
  handleExportNotes,
  handleGenerateNotes,
}: StudyLeftPanelProps) {

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

  return (
    <div className="col-span-2 space-y-6">
      {/* Lecteur Vidéo */}
      <div className="bg-[#0e0e0e] rounded-lg overflow-hidden aspect-video relative">
        {url && isMounted ? (
          <div className="absolute inset-0 w-full h-full">
            <VideoPlayer
              playerRef={playerRef}
              url={url}
              onTimeUpdate={onTimeUpdate}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-[#2a5a8a] to-[#0e0e0e] opacity-20" />
        )}
      </div>

      {/* Titre et Badges */}
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
              {/* Actions de la transcription */}
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
            // Onglet Notes
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
                // Affichage des notes terminées
                <div className="space-y-4 animate-fade-in">
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
  );
}
