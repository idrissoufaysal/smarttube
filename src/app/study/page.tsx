'use client';

import { useState } from 'react';
import { Settings, Bell, LogOut } from 'lucide-react';
import { ChatInterface } from '@/components/chat-interface';
import { QuizInterface } from '@/components/quiz-interface';

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <div className="min-h-screen bg-[#0b0b0d]">

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 p-6 max-w-6xl mx-auto">
        {/* Left Column - Video & Content */}
        <div className="col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-[#0e0e0e] rounded-lg overflow-hidden aspect-video flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a5a8a] to-[#0e0e0e] opacity-20"></div>
            
            {/* Neon Brain Illustration */}
            <div className="relative z-10 w-64 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Neon glow effect */}
                <defs>
                  <filter id="neon-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Brain outline - left */}
                <path
                  d="M 60 120 Q 40 100 40 70 Q 40 40 60 30 Q 70 25 80 30 Q 85 20 90 25 Q 95 15 100 25"
                  fill="none"
                  stroke="#00d9ff"
                  strokeWidth="2"
                  filter="url(#neon-glow)"
                />
                
                {/* Brain outline - right */}
                <path
                  d="M 140 120 Q 160 100 160 70 Q 160 40 140 30 Q 130 25 120 30 Q 115 20 110 25 Q 105 15 100 25"
                  fill="none"
                  stroke="#00d9ff"
                  strokeWidth="2"
                  filter="url(#neon-glow)"
                />
                
                {/* Base */}
                <ellipse cx="100" cy="140" rx="50" ry="20" fill="none" stroke="#00d9ff" strokeWidth="2" filter="url(#neon-glow)"/>
                
                {/* Play button */}
                <circle cx="100" cy="100" r="25" fill="none" stroke="#ff6b4a" strokeWidth="2"/>
                <polygon points="95,90 95,110 115,100" fill="#ff6b4a"/>
              </svg>
            </div>
          </div>

          {/* Video Title & Info */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Neural Networks: The Fundamentals of Deep Learning
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#ebbbb4]">
              <span>📅 Oct 12, 2023</span>
              <span>👁️ 1.2M views</span>
              <div className="flex gap-2">
                <span className="bg-[#353534] text-[#ffb4a8] px-3 py-1 rounded text-xs font-semibold">ADVANCED</span>
                <span className="bg-[#353534] text-[#ffb4a8] px-3 py-1 rounded text-xs font-semibold">AI/ML</span>
              </div>
            </div>
          </div>

          {/* Key Takeaways */}
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

        {/* Right Column - AI Assistant & Questions */}
        <div className="space-y-6">
          {/* Study Session Timer */}
          <div className="bg-[#1c1b1b] rounded-lg p-6 border border-[#353534] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#ff5540] flex items-center justify-center">
                <span className="text-[#ff5540]">🎧</span>
              </div>
              <div>
                <p className="text-xs text-[#603e39] font-semibold uppercase">Study Session</p>
                <p className="text-2xl font-bold text-white font-mono">45:12</p>
              </div>
            </div>
            <button className="text-[#ebbbb4] hover:text-[#ffb4a8]">
              ⏸️
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#353534] flex gap-0">
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

          {/* Content Based on Tab */}
          {activeTab === 'ai' ? (
            <ChatInterface transcript="Ceci est une transcription factice. Dans une version finale, la page récupérera la transcription via l'URL YouTube." />
          ) : (
            <QuizInterface transcript="Ceci est une transcription factice. Dans une version finale, la page récupérera la transcription via l'URL YouTube." />
          )}
        </div>
      </div>
    </div>
  );
}
