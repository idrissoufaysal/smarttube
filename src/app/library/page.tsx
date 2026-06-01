import { prisma } from '@/lib/db';
import Link from 'next/link';

async function getLibraryVideos() {
  try {
    return await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        author: true,
        thumbnail: true,
        duration: true,
        createdAt: true,
        _count: { select: { segments: true } },
        attempts: {
          select: {
            score: true,
            total: true,
          }
        }
      },
    });
    console.log();
    
  } catch (error) {
    console.error("PRISMA ERROR IN LIBRARY:", error);
    return null; // DB not configured — graceful fallback
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconEmpty = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-16 w-16 opacity-20">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

type VideoCard = {
  id: string;
  title: string;
  author: string | null;
  thumbnail: string | null;
  duration: number;
  createdAt: Date;
  _count: { segments: number };
  attempts: { score: number; total: number }[];
};

function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#111115] overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 bg-white/5 rounded w-12" />
          <div className="h-3 bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function VideoCardComponent({ video }: { video: VideoCard }) {
  const studyUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <Link
      href={`/study?url=${encodeURIComponent(studyUrl)}`}
      className="group relative rounded-2xl bg-[#111115] overflow-hidden transition-all duration-300 hover:bg-[#141419] hover:scale-[1.02] hover:shadow-2xl block cursor-pointer"
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255, 180, 168, 0.07), transparent 60%)' }}
      />

      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1a1a1e] overflow-hidden">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1e2028] to-[#13141a]">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <IconPlay />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-md">
          <IconClock />
          <span>{formatDuration(video.duration)}</span>
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/15 flex items-center justify-center transition-all duration-300 scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 backdrop-blur-sm">
            <IconPlay />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 relative">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1 group-hover:text-[#ffb4a8] transition-colors duration-200">
          {video.title}
        </h3>
        {video.author && (
          <p className="text-xs text-white/40 mb-3 truncate">{video.author}</p>
        )}

        {/* Mastered / Studied Quiz Badges */}
        {video.attempts && video.attempts.length > 0 ? (() => {
          let maxPct = 0;
          let bestAttempt = video.attempts[0];
          video.attempts.forEach(att => {
            const pct = (att.score / att.total) * 100;
            if (pct > maxPct) {
              maxPct = pct;
              bestAttempt = att;
            }
          });

          const isMastered = maxPct >= 80;

          return (
            <div className="flex items-center gap-2 mb-3 animate-fade-in">
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider ${
                isMastered 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {isMastered ? '🏆 MAÎTRISÉ' : `💡 APPRIS`}
              </span>
              <span className="text-[10px] text-white/50 font-bold font-mono">
                Quiz : {bestAttempt.score}/{bestAttempt.total} ({video.attempts.length} t.)
              </span>
            </div>
          );
        })() : (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border bg-white/5 text-white/30 border-white/5 tracking-wider">
              📖 REVOIR
            </span>
            <span className="text-[10px] text-white/25">
              Quiz non tenté
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-[10px] text-white/30 font-medium">
          <span className="flex items-center gap-1">
            <IconBook />
            {video._count.segments} segments
          </span>
          <span>Étudié le {formatDate(video.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function LibraryPage() {
  const videos = await getLibraryVideos();

  return (
    <div className="min-h-screen bg-[#0b0b0d]">
      {/* Page header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,_rgba(255,180,168,0.06),_transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 md:px-8 pt-12 pb-10 relative">
          <p className="text-label text-[#ffb4a8] mb-3">Your Collection</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-headline text-white">My Library</h1>
              <p className="mt-2 text-sm text-white/40">
                All the videos you&apos;ve transformed into active study sessions.
              </p>
            </div>
            {videos && videos.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="rounded-2xl bg-[#111115] px-4 py-2.5 text-center min-w-[70px]">
                  <p className="text-xl font-extrabold gradient-primary-text">{videos.length}</p>
                  <p className="text-[9px] text-white/35 uppercase tracking-widest mt-0.5">Videos</p>
                </div>
                <div className="rounded-2xl bg-[#111115] px-4 py-2.5 text-center min-w-[70px]">
                  <p className="text-xl font-extrabold gradient-primary-text">
                    {videos.reduce((acc, v) => acc + v._count.segments, 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-white/35 uppercase tracking-widest mt-0.5">Segments</p>
                </div>
                <div className="rounded-2xl bg-[#111115] px-4 py-2.5 text-center min-w-[70px]">
                  <p className="text-xl font-extrabold gradient-primary-text">
                    {videos.reduce((acc, v) => acc + v.attempts.length, 0)}
                  </p>
                  <p className="text-[9px] text-white/35 uppercase tracking-widest mt-0.5">Quiz</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-10">
        {/* DB not configured */}
        {videos === null && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111115] flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-[#ffb4a8]">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
                <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Base de données non configurée</h2>
            <p className="text-sm text-white/40 max-w-sm mb-8">
              Ajoutez votre variable <code className="text-[#ffb4a8] bg-white/5 px-1.5 py-0.5 rounded text-xs">DATABASE_URL</code> dans le fichier <code className="text-[#ffb4a8] bg-white/5 px-1.5 py-0.5 rounded text-xs">.env</code> pour activer votre bibliothèque personnelle.
            </p>
            <code className="text-xs text-white/30 bg-[#111115] px-4 py-2 rounded-xl border border-white/5 font-mono">
              DATABASE_URL=&quot;postgresql://user:pass@host/smarttube&quot;
            </code>
          </div>
        )}

        {/* Empty state */}
        {videos !== null && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <IconEmpty />
            <h2 className="text-xl font-bold text-white mt-6 mb-2">Your library is empty</h2>
            <p className="text-sm text-white/40 max-w-sm mb-8">
              You haven&apos;t studied any videos yet. Paste a YouTube link to start building your personal knowledge base.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold gradient-primary text-[#2b140f] shadow-[0_8px_32px_rgba(255,85,64,0.25)] hover:shadow-[0_16px_48px_rgba(255,85,64,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              <IconPlay />
              Study your first video
            </Link>
          </div>
        )}

        {/* Video grid */}
        {videos !== null && videos.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCardComponent key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
