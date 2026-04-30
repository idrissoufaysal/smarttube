'use client';

import { useChat } from '@ai-sdk/react';
import {  DefaultChatTransport } from 'ai';
import { Send, Mic, Paperclip, Sparkles, BrainCircuit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatInterfaceProps {
  transcript: string;
}

export function ChatInterface({ transcript }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { transcript },
    }),
  });

  const isLoading = status === 'submitted'

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Scroll instantané pendant le streaming (pas de delay)
  useEffect(() => {
    if (status === 'streaming') {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'instant',
      });
    }
  }, [messages, status]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant space-y-4">
            <BrainCircuit className="w-10 h-10 opacity-50" />
            <p className="text-sm">Bonjour ! Je suis SmartTube AI.<br />Posez-moi des questions sur cette vidéo.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 text-sm ${m.role === 'user'
                    ? 'bg-primary-container text-on-primary-container font-medium'
                    : 'bg-surface-high text-on-surface-variant border border-outline-variant'
                  }`}
              >
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit  className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary tracking-wider uppercase">SmartTube AI</span>
                  </div>
                )}

                {m.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <p key={i} className="leading-relaxed whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  return null;
                })}

              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-4 bg-surface-high border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-bold text-primary tracking-wider uppercase">SmartTube AI</span>
              </div>
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-surface-lowest border border-surface-highest rounded-2xl p-2 mt-auto">
        <form onSubmit={handleSubmit} className="flex flex-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about this video..."
            className="w-full bg-transparent text-on-surface p-3 text-sm placeholder-outline-variant focus:outline-none resize-none"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-2 pb-1 mt-2">

           
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 -ml-0.5" />
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
