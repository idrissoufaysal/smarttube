'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCcw, 
  Loader2, 
  Trophy, 
  Sparkles, 
  History, 
  ChevronRight 
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizAttempt {
  id: string;
  score: number;
  total: number;
  difficulty: string;
  createdAt: string;
}

interface QuizInterfaceProps {
  transcript: string;
  videoId?: string;
}

export function QuizInterface({ transcript, videoId }: QuizInterfaceProps) {
  const { userId } = useAuth();
  
  // Quiz setup settings
  const [selectedDifficulty, setSelectedDifficulty] = useState<'facile' | 'moyen' | 'difficile'>('moyen');
  const [selectedQuestionsCount, setSelectedQuestionsCount] = useState<5 | 10 | 15>(5);
  
  // Quiz execution states
  const [quizState, setQuizState] = useState<'setup' | 'generating' | 'active' | 'finished'>('setup');
  const [quizId, setQuizId] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  
  // Database attempts history
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Fetch past attempts on mount and when videoId changes
  useEffect(() => {
    if (videoId) {
      fetchAttempts();
    }
  }, [videoId]);

  const fetchAttempts = async () => {
    if (!videoId) return;
    setLoadingAttempts(true);
    try {
      const url = `/api/quiz/attempt?videoId=${videoId}${userId ? `&userId=${userId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      console.error('Erreur chargement historiques:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const startQuizGeneration = async () => {
    setQuizState('generating');
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);

    try {
      const res = await fetch('/api/video/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript, 
          difficulty: selectedDifficulty, 
          numberOfQuestions: selectedQuestionsCount, 
          videoId 
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la génération du quiz');

      const data = await res.json();
      if (data.quiz && data.quiz.questions) {
        setQuestions(data.quiz.questions);
        setQuizId(data.quiz.id || '');
        setQuizState('active');
      } else {
        throw new Error('Format de quiz invalide reçu');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
      setQuizState('setup');
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(index);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerChecked(true);
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      // Quiz finished - save attempt to database first
      setQuizState('finished');
      await saveQuizAttempt();
    }
  };

  const saveQuizAttempt = async () => {
    if (!videoId || !quizId) return;
    try {
      const finalScore = selectedAnswer === questions[currentQuestionIndex].correctAnswerIndex ? score + 1 : score;
      await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          quizId,
          score: finalScore,
          total: questions.length,
          difficulty: selectedDifficulty,
          userId: userId || undefined
        })
      });
      // Refresh history list
      fetchAttempts();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du score:', err);
    }
  };

  const getMasteryBadge = (pct: number) => {
    if (pct >= 80) return { label: '🏆 Maître', bg: 'bg-green-500/15 text-green-400 border-green-500/20' };
    if (pct >= 50) return { label: '💡 Apprenti', bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' };
    return { label: '📖 À revoir', bg: 'bg-red-500/15 text-red-400 border-red-500/20' };
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'facile': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'difficile': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  // --- 1. SETUP / CONFIGURATION SCREEN ---
  if (quizState === 'setup') {
    return (
      <div className="flex flex-col h-full overflow-y-auto pr-1 scrollbar-thin py-4 space-y-6 animate-fade-in">
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Practice Questions</h3>
            <p className="text-xs text-white/50">Configurez votre session de révision active</p>
          </div>
        </div>

        {/* Error notification if generation failed */}
        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-center animate-fade-up">
            <p className="text-sm text-error mb-3">{error}</p>
          </div>
        )}

        {/* Options Panel */}
        <div className="bg-[#111115] border border-white/5 rounded-2xl p-5 space-y-5">
          {/* Difficulty Selection */}
          <div className="space-y-2.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/35">Niveau de difficulté</label>
            <div className="grid grid-cols-3 gap-2">
              {(['facile', 'moyen', 'difficile'] as const).map(diff => {
                const isActive = selectedDifficulty === diff;
                let activeStyle = "";
                if (diff === 'facile') activeStyle = "border-cyan-500/40 bg-cyan-500/10 text-cyan-400";
                else if (diff === 'difficile') activeStyle = "border-red-500/40 bg-red-500/10 text-red-400";
                else activeStyle = "border-orange-500/40 bg-orange-500/10 text-orange-400";

                return (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? activeStyle 
                        : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Questions Selection */}
          <div className="space-y-2.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/35">Nombre de questions</label>
            <div className="grid grid-cols-3 gap-2">
              {([5, 10, 15] as const).map(count => {
                const isActive = selectedQuestionsCount === count;
                return (
                  <button
                    key={count}
                    onClick={() => setSelectedQuestionsCount(count)}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {count} Questions
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={startQuizGeneration}
            className="w-full py-4.5 bg-linear-to-br from-primary to-primary-container text-[#2b140f] font-extrabold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(255,85,64,0.15)] hover:shadow-[0_8px_32px_rgba(255,85,64,0.25)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            LANCER LE QUIZ
          </button>
        </div>

        {/* Attempts History Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40">
            <History className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Historique de vos tentatives</span>
          </div>

          {loadingAttempts ? (
            <div className="flex items-center justify-center py-6 text-white/30 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement de l&apos;historique...
            </div>
          ) : attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-xs text-white/35">
              Aucune tentative enregistrée. Obtenez votre premier badge !
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {attempts.map(att => {
                const pct = Math.round((att.score / att.total) * 100);
                const badge = getMasteryBadge(pct);
                
                return (
                  <div key={att.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white font-mono">{att.score}/{att.total}</span>
                        <span className="text-[10px] font-semibold text-white/30">({pct}%)</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold border px-1.5 py-0.5 rounded-md ${getDifficultyColor(att.difficulty)}`}>
                          {att.difficulty}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40">{formatDate(att.createdAt)}</p>
                    </div>

                    <span className={`text-xs font-bold border px-2.5 py-1 rounded-xl shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 2. GENERATING ACTIVE SCREEN ---
  if (quizState === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary animate-spin duration-3000">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-white mb-2">Conception du Quiz IA...</h4>
        <p className="text-xs text-white/40 max-w-xs leading-relaxed">
          Notre enseignant IA analyse la transcription vidéo pour formuler {selectedQuestionsCount} questions personnalisées en difficulté &quot;{selectedDifficulty}&quot;.
        </p>
      </div>
    );
  }

  // --- 3. RESULTS / SCORE SUMMARY SCREEN ---
  if (quizState === 'finished') {
    const finalScore = selectedAnswer === questions[currentQuestionIndex].correctAnswerIndex ? score + 1 : score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    const badge = getMasteryBadge(percentage);

    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[400px] text-center py-6 animate-fade-in space-y-6">
        <div className="relative">
          {/* Outer radial glow */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
          
          <div className="relative text-7xl font-black text-white font-mono tracking-tighter bg-white/5 border border-white/10 rounded-3xl w-32 h-32 flex items-center justify-center shadow-2xl">
            {finalScore}/{questions.length}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase font-extrabold tracking-widest text-[#ff8f87]">Session complétée ({percentage}%)</p>
          <div className="flex justify-center pt-1.5">
            <span className={`text-sm font-extrabold border px-4 py-1.5 rounded-full ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="max-w-xs text-sm text-white/50 leading-relaxed">
          {percentage >= 80 ? (
            <p className="text-green-400 font-medium">Masterclass ! Vous avez parfaitement assimilé les concepts clés présentés.</p>
          ) : percentage >= 50 ? (
            <p className="text-yellow-400 font-medium">Bonne maîtrise globale, quelques points méritent d&apos;être consolidés.</p>
          ) : (
            <p className="text-red-400/90 font-medium">Nous vous recommandons de réécouter la vidéo ou de poser des questions à l&apos;assistant IA.</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs pt-4">
          <button
            onClick={startQuizGeneration}
            className="w-full py-3.5 bg-primary text-[#2b140f] font-extrabold rounded-xl text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            Nouveau Quiz
          </button>
          
          <button
            onClick={() => setQuizState('setup')}
            className="w-full py-3.5 bg-white/5 border border-white/10 text-white/80 font-bold rounded-xl text-sm transition-all hover:bg-white/10 cursor-pointer"
          >
            Retour aux réglages
          </button>
        </div>
      </div>
    );
  }

  // --- 4. ACTIVE QUIZ EXECUTION SCREEN ---
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-full py-4 space-y-4 animate-fade-in">
      {/* Header Info */}
      <div className="flex justify-between items-center shrink-0">
        <span className="text-[10px] font-extrabold tracking-widest uppercase text-white/35">
          Question {currentQuestionIndex + 1} sur {questions.length}
        </span>
        <div className="flex items-center gap-2 bg-[#ff5540]/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
          <Trophy className="w-3.5 h-3.5" />
          <span className="text-xs font-black font-mono">Score : {score}</span>
        </div>
      </div>

      {/* The Question Text */}
      <div className="bg-[#111115] border border-white/5 rounded-2xl p-5 shrink-0">
        <h3 className="text-sm md:text-base font-extrabold text-white leading-snug">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Answer Options Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
        {currentQuestion.options.map((option, index) => {
          let buttonClass = "w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 cursor-pointer flex justify-between items-center ";

          if (!isAnswerChecked) {
            buttonClass += selectedAnswer === index
              ? "bg-primary/10 border-primary text-primary"
              : "bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5 hover:text-white";
          } else {
            if (index === currentQuestion.correctAnswerIndex) {
              buttonClass += "bg-green-500/10 border-green-500/30 text-green-400 font-bold";
            } else if (index === selectedAnswer) {
              buttonClass += "bg-red-500/10 border-red-500/30 text-red-400";
            } else {
              buttonClass += "bg-transparent border-transparent text-white/20 opacity-40";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswerChecked}
              className={buttonClass}
            >
              <span className="leading-snug pr-4">{option}</span>
              {isAnswerChecked && index === currentQuestion.correctAnswerIndex && (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              )}
              {isAnswerChecked && index === selectedAnswer && index !== currentQuestion.correctAnswerIndex && (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom control panel */}
      <div className="pt-3 border-t border-white/5 shrink-0">
        {!isAnswerChecked ? (
          <button
            onClick={checkAnswer}
            disabled={selectedAnswer === null}
            className="w-full py-4.5 bg-linear-to-br from-primary to-primary-container text-[#2b140f] font-extrabold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer"
          >
            VÉRIFIER LA RÉPONSE
          </button>
        ) : (
          <div className="space-y-3.5 animate-fade-up">
            {/* Explanation box */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              selectedAnswer === currentQuestion.correctAnswerIndex
                ? 'bg-green-500/5 border-green-500/10 text-green-400/90'
                : 'bg-red-500/5 border-red-500/10 text-red-400/90'
            }`}>
              <span className="font-extrabold block mb-1 uppercase tracking-wider">
                {selectedAnswer === currentQuestion.correctAnswerIndex ? '✓ Correct' : '✗ Erreur'}
              </span>
              {currentQuestion.explanation}
            </div>

            {/* Next / Finished button */}
            <button
              onClick={nextQuestion}
              className="w-full py-4.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-sm transition-all hover:bg-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{currentQuestionIndex < questions.length - 1 ? 'QUESTION SUIVANTE' : 'VOIR LES RÉSULTATS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
