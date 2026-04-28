'use client';

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function Header() {
  return (
    <header className="sticky top-0 z-50 glass-subtle">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <IconPlay />
            </div>
            <span className="text-base font-black tracking-tight text-[#ff8f87]">SMARTTUBE</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-white/50 md:flex">
            <a href="/" className="transition-colors duration-200 hover:text-white/90">Home</a>
            <a href="#" className="transition-colors duration-200 hover:text-white/90">My Library</a>
            <a href="#" className="transition-colors duration-200 hover:text-white/90">Explore</a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <a href="#" className="hidden text-white/55 transition-colors hover:text-white/80 md:inline">Log in</a>
          <a
            href="#"
            className="rounded-xl px-4 py-2 text-xs font-bold gradient-primary text-[#2b140f] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </header>
  );
}
