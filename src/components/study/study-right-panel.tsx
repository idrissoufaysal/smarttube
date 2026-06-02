'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { QuizInterface } from '@/components/quiz-interface';

export interface StudyRightPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  transcript: string;
  url: string;
  videoId: string | undefined;
  handleTimelineClick: (seconds: number) => void;
}

export function StudyRightPanel({
  activeTab,
  setActiveTab,
  transcript,
  url,
  videoId,
  handleTimelineClick,
}: StudyRightPanelProps) {
  return (
    <div className="w-[450px] bg-surface-low border-l border-outline-variant/10 flex flex-col shrink-0 h-full overflow-hidden">
      <div className="border-b border-outline-variant/10 bg-surface-container-low flex gap-0 shrink-0">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-5 text-sm font-bold border-b-2 transition tracking-tight cursor-pointer ${
            activeTab === 'ai'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
          }`}
        >
          AI Assistant
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex-1 py-5 text-sm font-bold border-b-2 transition tracking-tight cursor-pointer ${
            activeTab === 'practice'
              ? 'text-primary border-primary'
              : 'text-on-surface-variant border-transparent hover:text-on-surface'
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
  );
}
