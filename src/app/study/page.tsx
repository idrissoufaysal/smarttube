import { Suspense } from 'react';
import { StudyContent } from '@/components/study-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "SmartTube | Session d'étude",
  description: "Étudiez vos vidéos de manière active avec des synthèses par IA, des transcriptions interactives et des quiz personnalisés.",
};

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0d] flex items-center justify-center">
        <p className="text-white/50 animate-pulse">Chargement de la session d'étude...</p>
      </div>
    }>
      <StudyContent />
    </Suspense>
  );
}
