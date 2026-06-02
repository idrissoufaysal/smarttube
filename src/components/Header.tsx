'use client';

import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Image from 'next/image';

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function Header() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-subtle">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={200} height={250} />
             </a>
          <nav className="hidden items-center gap-6 text-sm text-white/50 md:flex">
            <a href="/" className="transition-colors duration-200 hover:text-white/90">Home</a>
            <a href="/library" className="transition-colors duration-200 hover:text-white/90">My Library</a>
            <a href="#" className="transition-colors duration-200 hover:text-white/90">Explore</a>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs min-h-[32px]">
          {isLoaded ? (
            isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="hidden text-white/55 transition-colors hover:text-white/85 md:inline cursor-pointer">
                    Se connecter
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-sm px-4 py-2 text-xs font-bold gradient-primary text-[#2b140f] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] cursor-pointer">
                    Commencer
                  </button>
                </SignUpButton>
              </>
            )
          ) : (
            <div className="w-8 h-8 rounded-full border border-white/15 animate-pulse bg-white/5" />
          )}
        </div>
      </div>
    </header>
  );
}
