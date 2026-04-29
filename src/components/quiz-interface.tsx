'use client';

import { useState } from 'react';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizInterfaceProps {
  transcript: string;
}

export function QuizInterface({ transcript }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    setIsGenerating(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);

    try {
      const res = await fetch('/api/video/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, difficulty: 'moyen', numberOfQuestions: 5 }),
      });

      if (!res.ok) throw new Error('Erreur lors de la génération du quiz');

      const data = await res.json();
      if (data.quiz && data.quiz.questions) {
        setQuestions(data.quiz.questions);
      } else {
        throw new Error('Format de quiz invalide reçu');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsGenerating(false);
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
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      setIsFinished(true);
    }
  };

  if (questions.length === 0 && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[500px]">
        <div className="w-16 h-16 rounded-full border-2 border-primary-container flex items-center justify-center mb-6">
          <BrainCircuit className="w-8 h-8 text-primary-container" />
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">Practice Questions</h3>
        <p className="text-on-surface-variant text-sm mb-8 max-w-sm">
          Générez un quiz interactif basé sur le contenu de cette vidéo pour vérifier votre compréhension.
        </p>
        <button
          onClick={generateQuiz}
          className="bg-primary-container text-on-primary-container px-6 py-3 rounded hover:bg-primary transition-colors font-semibold tracking-wide text-sm"
        >
          GENERATE QUIZ
        </button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <Loader2 className="w-10 h-10 text-primary-container animate-spin mb-4" />
        <p className="text-on-surface-variant text-sm animate-pulse">Analyse de la vidéo en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-error-container/20 border border-error text-center rounded-lg mt-8">
        <p className="text-error mb-4">{error}</p>
        <button
          onClick={generateQuiz}
          className="bg-surface-highest text-on-surface px-4 py-2 rounded hover:bg-surface-bright transition-colors text-sm font-semibold"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-center">
        <div className="text-6xl font-bold text-on-surface mb-2 font-mono">{score}/{questions.length}</div>
        <p className="text-outline-variant font-bold tracking-widest uppercase text-sm mb-8">Score final ({percentage}%)</p>
        
        {percentage >= 80 ? (
          <p className="text-green-400 mb-8 font-medium">Excellent travail !</p>
        ) : percentage >= 50 ? (
          <p className="text-yellow-400 mb-8 font-medium">Pas mal ! Quelques révisions nécessaires.</p>
        ) : (
          <p className="text-error mb-8 font-medium">Il serait bon de revoir la vidéo.</p>
        )}

        <button
          onClick={generateQuiz}
          className="bg-surface-high border border-outline-variant text-on-surface-variant px-6 py-3 rounded hover:bg-surface-highest transition-colors font-semibold flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Nouveau Quiz
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-[600px] py-4">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold tracking-widest uppercase text-outline-variant">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        <span className="text-xs font-bold tracking-widest text-primary">Score : {score}</span>
      </div>

      <h3 className="text-lg font-bold text-on-surface mb-6 leading-relaxed">
        {currentQuestion.question}
      </h3>

      <div className="space-y-3 mb-6 overflow-y-auto pr-2 scrollbar-thin">
        {currentQuestion.options.map((option, index) => {
          let buttonClass = "w-full text-left p-4 rounded border transition-all ";
          
          if (!isAnswerChecked) {
            buttonClass += selectedAnswer === index
              ? "bg-primary-container/20 border-primary-container text-primary"
              : "bg-surface-high border-outline-variant text-on-surface-variant hover:bg-surface-highest";
          } else {
            if (index === currentQuestion.correctAnswerIndex) {
              buttonClass += "bg-green-500/10 border-green-500/50 text-green-400";
            } else if (index === selectedAnswer) {
              buttonClass += "bg-error-container/20 border-error text-error";
            } else {
              buttonClass += "bg-transparent border-transparent text-outline-variant opacity-50";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswerChecked}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm leading-relaxed">{option}</span>
                {isAnswerChecked && index === currentQuestion.correctAnswerIndex && (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 ml-4" />
                )}
                {isAnswerChecked && index === selectedAnswer && index !== currentQuestion.correctAnswerIndex && (
                  <XCircle className="w-5 h-5 text-error shrink-0 ml-4" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-surface-highest">
        {!isAnswerChecked ? (
          <button
            onClick={checkAnswer}
            disabled={selectedAnswer === null}
            className="w-full py-3 bg-primary-container text-on-primary-container rounded font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary transition-colors"
          >
            VÉRIFIER
          </button>
        ) : (
          <div className="animate-fade-up">
            <div className={`p-4 rounded mb-4 ${
              selectedAnswer === currentQuestion.correctAnswerIndex 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-error-container/20 border border-error/20'
            }`}>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                <span className={`font-bold block mb-1 ${selectedAnswer === currentQuestion.correctAnswerIndex ? 'text-green-400' : 'text-error'}`}>
                  {selectedAnswer === currentQuestion.correctAnswerIndex ? 'Bonne réponse !' : 'Oups...'}
                </span>
                {currentQuestion.explanation}
              </p>
            </div>
            <button
              onClick={nextQuestion}
              className="w-full py-3 bg-surface-highest text-on-surface rounded font-semibold tracking-wide hover:bg-surface-bright transition-colors flex items-center justify-center gap-2"
            >
              {currentQuestionIndex < questions.length - 1 ? 'QUESTION SUIVANTE' : 'VOIR LES RÉSULTATS'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
