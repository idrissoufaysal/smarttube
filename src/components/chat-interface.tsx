'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { Send, BrainCircuit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatInterfaceProps {
  transcript: string;
  url?: string;
  onTimelineClick?: (seconds: number) => void;
}

export function ChatInterface({ transcript, url, onTimelineClick }: ChatInterfaceProps) {
  const videoId = url ? extractVideoId(url) : null;
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (!videoId) {
      setIsLoadingHistory(false);
      return;
    }

    fetch(`/api/chat/history?videoId=${videoId}`, {
    next: { revalidate: 60 },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInitialMessages(
            data.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
              parts: [{ type: 'text', text: m.content }],
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingHistory(false));
  }, [videoId]);

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 12rem)' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ChatInterfaceInner 
      transcript={transcript} 
      videoId={videoId} 
      onTimelineClick={onTimelineClick} 
      initialMessages={initialMessages} 
    />
  );
}

function ChatInterfaceInner({ 
  transcript, 
  videoId, 
  onTimelineClick, 
  initialMessages 
}: { 
  transcript: string, 
  videoId: string | null, 
  onTimelineClick?: (seconds: number) => void,
  initialMessages: UIMessage[]
}) {
  const [input, setInput] = useState('');

  const renderMessageContent = (text: string) => {
    // Regex pour capturer [Source: mm:ss] ou [Source: hh:mm:ss]
    const regex = /\[Source:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Texte avant la source
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const part1 = parseInt(match[1], 10);
      const part2 = parseInt(match[2], 10);
      const part3 = match[3] ? parseInt(match[3], 10) : undefined;

      let totalSeconds = 0;
      if (part3 !== undefined) {
        // hh:mm:ss
        totalSeconds = part1 * 3600 + part2 * 60 + part3;
      } else {
        // mm:ss
        totalSeconds = part1 * 60 + part2;
      }

      const label = part3 !== undefined 
        ? `${part1.toString().padStart(2, '0')}:${part2.toString().padStart(2, '0')}:${part3.toString().padStart(2, '0')}`
        : `${part1.toString().padStart(2, '0')}:${part2.toString().padStart(2, '0')}`;

      parts.push(
        <button
          key={match.index}
          onClick={() => onTimelineClick && onTimelineClick(totalSeconds)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 mx-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary hover:bg-primary/20 active:scale-95 transition-all cursor-pointer inline-block"
          type="button"
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
          [Source: {label}]
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { transcript, videoId },
    })
  });

  const isLoading = status === 'submitted';

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessagesLengthRef = useRef(messages.length);

  // Smart auto-scroll logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hasNewMessage = messages.length > lastMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isUserLastMessage = lastMessage?.role === 'user';

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    // Smooth scroll for new user messages, instant scroll for streaming/responses if already near bottom
    if (hasNewMessage && isUserLastMessage) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    } else if (isNearBottom || (hasNewMessage && !isUserLastMessage)) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'auto',
      });
    }

    lastMessagesLengthRef.current = messages.length;
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
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary tracking-wider uppercase">SmartTube AI</span>
                  </div>
                )}

                {m.parts ? m.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <div key={i} className="leading-relaxed whitespace-pre-wrap">
                        {renderMessageContent(part.text)}
                      </div>
                    );
                  }
                  return null;
                }) : typeof (m as any).content === 'string' && (
                   <div className="leading-relaxed whitespace-pre-wrap">
                      {renderMessageContent((m as any).content)}
                   </div>
                )}

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
