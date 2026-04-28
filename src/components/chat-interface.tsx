'use client';

import { useChat } from '@ai-sdk/react';
import { Send, Mic, Paperclip, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatInterfaceProps {
  transcript: string;
}

export function ChatInterface({ transcript }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const { messages, append, isLoading, setMessages, status } = useChat({
    api: '/api/chat',
    body: {
      transcript
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Formulaire gérant l'appui sur "Entrée" pour soumettre
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // On déclenche manuellement la soumission du formulaire
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant space-y-4">
            <Sparkles className="w-10 h-10 opacity-50" />
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
                    ? 'bg-primary-container text-on-primary-container font-medium' // Style Utilisateur
                    : 'bg-surface-high text-on-surface-variant border border-outline-variant' // Style IA
                  }`}
              >
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary tracking-wider uppercase">SmartTube AI</span>
                  </div>
                )}

                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-4 bg-surface-high border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
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

      {/* Input Area */}
      <div className="bg-surface-lowest border border-surface-highest rounded-2xl p-2 mt-auto">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about this video..."
            className="w-full bg-transparent text-on-surface p-3 text-sm placeholder-outline-variant focus:outline-none resize-none"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-2 pb-1 mt-2">
            <div className="flex items-center gap-3 text-outline-variant">
              <button type="button" className="hover:text-on-surface-variant transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-on-surface-variant transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold tracking-widest text-outline-variant uppercase hidden sm:block">
                Press Enter to send
              </span>
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 -ml-0.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
