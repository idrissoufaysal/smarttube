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
  );
}
