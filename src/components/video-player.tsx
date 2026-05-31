'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

export interface VideoPlayerProps {
  url: string;
  playerRef?: React.MutableRefObject<any>;
}

export default function VideoPlayer({ url, playerRef }: VideoPlayerProps) {
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
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
