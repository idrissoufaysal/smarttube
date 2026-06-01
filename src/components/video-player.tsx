'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

export interface VideoPlayerProps {
  url: string;
  playerRef?: React.MutableRefObject<any>;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({ url, playerRef, onTimeUpdate }: VideoPlayerProps) {
  return (
    <MediaPlayer
      ref={playerRef}
      src={url}
      viewType="video"
      streamType="on-demand"
      logLevel="warn"
      crossOrigin
      playsInline
      autoplay
      className="w-full h-full bg-black"
      onTimeUpdate={(e: any) => onTimeUpdate?.(e.detail?.currentTime ?? e.currentTime)}
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
