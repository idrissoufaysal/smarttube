"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ─── SVG Icon Components ─── */
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
    <path d="M12 2a7 7 0 0 0-4.6 12.3A4.5 4.5 0 0 0 9.5 22h5a4.5 4.5 0 0 0 2.1-7.7A7 7 0 0 0 12 2Z" />
    <path d="M12 2v20M8 6h8M7 10h10M8 14h8M9.5 18h5" strokeOpacity=".5" />
  </svg>
);

const IconNotebook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M8 10h8M8 14h5" strokeOpacity=".7" />
    <path d="M4 6H2M4 10H2M4 14H2M4 18H2" />
  </svg>
);

const IconQuiz = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const IconPaste = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 opacity-40">
    <path d="M6 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1M9 2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

/* ─── Animated Section Observer ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Data ─── */
const FEATURES = [
  { icon: <IconBrain />, title: "Décryptage IA", desc: "Analyse approfondie de sujets complexes, divisés automatiquement en blocs faciles à assimiler.", color: "#93b7ff" },
  { icon: <IconNotebook />, title: "Notes Intelligentes", desc: "Annotez les vidéos en temps réel et exportez vos résumés directement vers Notion ou Obsidian.", color: "#ffb8ac" },
  { icon: <IconQuiz />, title: "Mode Quiz", desc: "Testez vos connaissances grâce à des quiz générés par l'IA et adaptés au contenu de la vidéo.", color: "#ffc78f" },
];

const STEPS = [
  { num: "01", title: "Collez un lien", desc: "Insérez n'importe quelle URL YouTube dans SmartTube. Notre IA commence instantanément à traiter le contenu." },
  { num: "02", title: "Apprenez activement", desc: "Obtenez des transcriptions, des points clés et un assistant IA qui répond à toutes vos questions sur la vidéo." },
  { num: "03", title: "Maîtrisez & Retenez", desc: "Faites des quiz générés par l'IA, passez en revue les explications et suivez votre progression au fil du temps." },
];

const STATS = [
  { value: "10K+", label: "Apprenants Actifs" },
  { value: "2.4M", label: "Vidéos Analysées" },
  { value: "94%", label: "Taux de Rétention" },
  { value: "4.9★", label: "Note Utilisateurs" },
];

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(url)) {
      setError("Veuillez entrer une URL YouTube valide.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Impossible d'extraire la transcription.");
        return;
      }

      // sessionStorage évite la limite de longueur d'URL
      sessionStorage.setItem('smarttube_transcript', data.transcript);
      sessionStorage.setItem('smarttube_segments', JSON.stringify(data.segments));
      sessionStorage.setItem('smarttube_url', url);
      router.push(`/study?url=${encodeURIComponent(url)}`);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-[#f2f2f3]">
      <style>{`
        .reveal-section {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .reveal-section.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <main >
        {/* ══════ HERO ══════ */}
        <section className="relative overflow-hidden min-h-screen pb-8 pt-16 md:pb-16 md:pt-28 hero-gradient">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 -z-10 opacity-20">
            <div className="w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
          </div>
          <div className="relative mx-auto max-w-6xl px-5 md:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-[1.1]">
                Transformez toutes vidéos en une <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-container">leçon structurée.</span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-pretty text-base leading-relaxed text-white/55 md:text-lg" style={{ animationDelay: "100ms" }}>
                Fini le visionnage passif. Place à l'apprentissage actif. Collez un lien pour générer
                instantanément des transcriptions, des notes propulsées par l'IA et des quiz personnalisés.
              </p>

              {/* URL Input */}
              <form onSubmit={handleSubmit} className="w-full max-w-3xl mt-8 mx-auto">
                <div className="h-15 bg-surface-container/50 backdrop-blur-lg p-2 rounded-lg border border-outline-variant/10 shadow-2xl flex flex-col md:flex-row gap-2">
                  <input
                    className="bg-transparent border-none focus:ring-0 w-full px-6 text-on-surface text-lg placeholder:text-neutral-600"
                    placeholder="Collez un lien YouTube..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="bg-linear-to-br from-primary to-primary-container text-on-primary-container w-full md:w-[35%] rounded-md font-bold text-lg hover:brightness-110 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Extraction...
                      </span>
                    ) : (
                      "Commencer "
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
                )}
              </form>

            </div>
          </div>
        </section>

        {/* ══════ FEATURES ══════ */}
        <section id="features" className="relative py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <RevealSection>
              <div className="mb-12 text-center">
                <p className="text-label text-[#ffb4a8]">Fonctionnalités clés</p>
                <h2 className="mt-3 text-headline text-white">Votre boîte à outils d'apprentissage propulsée par l'IA</h2>
              </div>
            </RevealSection>

            <div className="grid gap-10 md:grid-cols-3">
              {FEATURES.map((f, i) => (
                <RevealSection key={f.title} delay={i * 120}>
                  <article className="group relative rounded-2xl bg-[#111115] p-7 transition-all duration-300 hover:bg-[#141419]">
                    {/* Hover glow */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 30% 30%, ${f.color}08, transparent 60%)` }} />
                    <div className="relative">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${f.color}15`, color: f.color }}>
                        {f.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/50">{f.desc}</p>
                    </div>
                  </article>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ SHOWCASE ══════ */}
        <section className="relative py-8 md:py-16">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <RevealSection>
              <div className="relative overflow-hidden rounded-3xl bg-[#0e0f12]">
                <div className="relative h-[420px] w-full bg-gradient-to-b from-[#1a1c22] via-[#15171c] to-[#0e0f12]">
                  {/* Ambient light */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(255,255,255,0.06),_transparent_50%)]" />

                  {/* Mock UI preview */}
                  <div className="absolute left-1/2 top-8 w-[85%] max-w-[700px] -translate-x-1/2 animate-float">
                    <div className="overflow-hidden rounded-xl bg-[#17181d] ambient-shadow">
                      {/* Title bar */}
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111115]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5540]/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ffc78f]/40" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#93b7ff]/40" />
                        <span className="ml-3 text-[10px] text-white/25">SmartTube — Session d'étude</span>
                      </div>
                      {/* Content */}
                      <div className="flex gap-0">
                        {/* Video area */}
                        <div className="flex-1 p-3">
                          <div className="aspect-video rounded-lg bg-gradient-to-br from-[#1e2028] to-[#13141a] flex items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                              <IconPlay />
                            </div>
                          </div>
                          <div className="mt-2.5 space-y-1.5">
                            <div className="h-2.5 w-3/4 rounded bg-white/10" />
                            <div className="h-2 w-1/2 rounded bg-white/5" />
                          </div>
                        </div>
                        {/* Chat sidebar */}
                        <div className="hidden w-[180px] bg-[#111115] p-3 sm:block">
                          <div className="mb-2 h-2 w-16 rounded bg-white/10" />
                          <div className="space-y-2">
                            <div className="rounded-lg bg-[#ff5540]/15 p-2"><div className="h-1.5 w-full rounded bg-[#ffb4a8]/30" /><div className="mt-1 h-1.5 w-2/3 rounded bg-[#ffb4a8]/20" /></div>
                            <div className="rounded-lg bg-[#1c1d22] p-2"><div className="h-1.5 w-full rounded bg-white/10" /><div className="mt-1 h-1.5 w-4/5 rounded bg-white/5" /><div className="mt-1 h-1.5 w-1/2 rounded bg-white/5" /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#0e0f12] to-transparent" />

                  {/* Text overlay */}
                  <div className="absolute bottom-8 left-7 md:left-10">
                    <h3 className="text-3xl font-bold text-white md:text-4xl">Conçu pour la maîtrise.</h3>
                    <p className="mt-2 text-sm text-white/55">Le centre de commandement de l'étudiant moderne.</p>
                  </div>
                  <div className="absolute bottom-8 right-7 flex gap-2 md:right-10">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white/50">Optimisé OLED</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white/50">Lecteur sans publicité</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ══════ HOW IT WORKS ══════ */}
        <section id="how-it-works" className="relative py-16 md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <RevealSection>
              <div className="mb-16 text-center">
                <p className="text-label text-[#acc7ff]">Comment ça marche</p>
                <h2 className="mt-3 text-headline text-white">Trois étapes vers la maîtrise</h2>
              </div>
            </RevealSection>

            <div className="grid gap-8 md:grid-cols-3 md:gap-1">
              {STEPS.map((s, i) => (
                <RevealSection key={s.num} delay={i * 150}>
                  <div className="group relative rounded-2xl bg-[#0f1014] p-8 transition-all duration-300 hover:bg-[#111116]">
                    <span className="gradient-primary-text text-5xl font-black opacity-20 transition-opacity duration-300 group-hover:opacity-40">{s.num}</span>
                    <h3 className="mt-4 text-xl font-semibold text-white">{s.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/45">{s.desc}</p>
                    {i < STEPS.length - 1 && (
                      <div className="pointer-events-none absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-white/10 to-transparent md:block" />
                    )}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ STATS ══════ */}
        <section className="relative py-12 md:py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <RevealSection>
              <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-[#0f1014] py-10 text-center transition-colors duration-300 hover:bg-[#111116]">
                    <p className="gradient-primary-text text-4xl font-extrabold md:text-5xl">{s.value}</p>
                    <p className="mt-2 text-xs text-white/40 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ══════ FINAL CTA ══════ */}
        <section className="relative py-16 md:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,_rgba(255,85,64,0.1),_transparent_60%)]" />
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <RevealSection>
              <div className="relative mx-auto max-w-3xl text-center">
                <h2 className="text-headline md:text-4xl text-white">
                  Prêt à apprendre plus <span className="gradient-primary-text">intelligemment ?</span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base text-white/50">
                  Rejoignez des milliers d'étudiants qui ont transformé leurs habitudes d'étude avec SmartTube.
                </p>
                <a
                  href="#hero-input"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold gradient-primary text-[#2b140f] shadow-[0_8px_32px_rgba(255,85,64,0.25)] transition-all duration-200 hover:shadow-[0_16px_48px_rgba(255,85,64,0.3)] hover:scale-[1.03] active:scale-[0.98]"
                >
                  Commencer à apprendre — C'est gratuit
                  <IconArrow />
                </a>
              </div>
            </RevealSection>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="bg-[#0a0a0c]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md gradient-primary">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M8 5v14l11-7z" /></svg>
              </div>
              <span className="text-sm font-black tracking-tight text-[#ff8f87]">SMARTTUBE</span>
            </div>
            <p className="mt-2 text-xs text-white/35">
              © {new Date().getFullYear()} Study Sanctuary Inc. Tous droits réservés.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-white/45">
            <a href="#" className="transition-colors hover:text-white/75">Confidentialité</a>
            <a href="#" className="transition-colors hover:text-white/75">Conditions d'utilisation</a>
            <a href="#" className="transition-colors hover:text-white/75">Contact</a>
          </nav>
          <div className="flex gap-2">
            {/* Twitter / X */}
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            {/* GitHub */}
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" /></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
