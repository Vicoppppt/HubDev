import React, { useState, useEffect } from 'react';
import { HelpCircle, X, CheckCircle2, XCircle, ChevronRight, RotateCcw, Award, BookOpen, AlertCircle } from 'lucide-react';

export default function QuizModal({ isOpen, onClose, projectName }) {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectName) return;
    setLoading(true);
    fetch('/api/projects/' + encodeURIComponent(projectName) + '/quiz/data')
      .then(res => res.json())
      .then(data => {
        setLessons(data.lessons || []);
        if (data.lessons && data.lessons.length > 0) {
          startLesson(data.lessons[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, projectName]);

  const startLesson = (lesson) => {
    setSelectedLesson(lesson);
    const shuffled = [...(lesson.questions || [])].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 15));
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setHasSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const isMultiple = currentQ && Array.isArray(currentQ.answer);

  const toggleOption = (idx) => {
    if (hasSubmitted) return;
    if (isMultiple) {
      if (selectedAnswers.includes(idx)) {
        setSelectedAnswers(selectedAnswers.filter(i => i !== idx));
      } else {
        setSelectedAnswers([...selectedAnswers, idx]);
      }
    } else {
      setSelectedAnswers([idx]);
    }
  };

  const handleValidate = () => {
    if (selectedAnswers.length === 0 || hasSubmitted) return;
    setHasSubmitted(true);
    const correctAnswers = isMultiple ? currentQ.answer : [currentQ.answer];
    const isCorrect = correctAnswers.length === selectedAnswers.length &&
      correctAnswers.every(a => selectedAnswers.includes(a));
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswers([]);
      setHasSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    if (selectedLesson) startLesson(selectedLesson);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-[#090d16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">QCM Interactif Web</h3>
                {lessons.length > 1 ? (
                  <select
                    value={selectedLesson?.id || ''}
                    onChange={(e) => {
                      const l = lessons.find(x => x.id === e.target.value);
                      if (l) startLesson(l);
                    }}
                    className="text-xs px-2.5 py-0.5 rounded-lg font-medium bg-[#131b2e] text-pink-300 border border-pink-500/30 focus:outline-none"
                  >
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.lesson} ({l.totalQuestions} questions)</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-pink-950/40 text-pink-300 border border-pink-800/40">
                    {selectedLesson?.lesson || 'Python'} ({selectedLesson?.totalQuestions || 0} questions)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedLesson?.title || 'Entraînement aux questions du cours'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Chargement des questions...</div>
          ) : isFinished ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">Session terminée !</h4>
              <p className="text-sm text-slate-300">
                Votre score : <span className="text-pink-400 font-bold text-lg">{score}</span> / {total}
              </p>
              <div className="pt-4">
                <button
                  onClick={handleRestart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-semibold text-xs transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Recommencer avec 15 nouvelles questions</span>
                </button>
              </div>
            </div>
          ) : currentQ ? (
            <div className="space-y-5">
              {/* Progress & topic */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                <span className="font-medium text-pink-400">{currentQ.topic || 'Question'}</span>
                <span>Question {currentIndex + 1} sur {total} (Score: {score})</span>
              </div>

              {/* Prompt */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-white leading-snug">
                  {currentQ.question}
                </h4>
                {currentQ.code && (
                  <pre className="p-3.5 rounded-xl bg-[#060a12] border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {currentQ.code}
                  </pre>
                )}
                {isMultiple && (
                  <p className="text-xs text-amber-400 italic">* Plusieurs réponses possibles</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = selectedAnswers.includes(idx);
                  const correctAnswers = isMultiple ? currentQ.answer : [currentQ.answer];
                  const isCorrect = correctAnswers.includes(idx);

                  let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-200';
                  if (isSelected && !hasSubmitted) {
                    borderStyle = 'border-pink-500/80 bg-pink-950/20 text-white';
                  } else if (hasSubmitted) {
                    if (isCorrect) {
                      borderStyle = 'border-emerald-500 bg-emerald-950/20 text-emerald-300';
                    } else if (isSelected && !isCorrect) {
                      borderStyle = 'border-rose-500 bg-rose-950/20 text-rose-300';
                    } else {
                      borderStyle = 'border-slate-800/60 opacity-60 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => toggleOption(idx)}
                      disabled={hasSubmitted}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${borderStyle}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {hasSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {hasSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation when submitted */}
              {hasSubmitted && currentQ.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1 animate-in fade-in">
                  <span className="font-bold text-pink-400 block">Explication :</span>
                  <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">Aucune question trouvée.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-[#090d16] flex items-center justify-between gap-3">
          {lessons.length > 1 && (
            <select
              value={selectedLesson?.id || ''}
              onChange={(e) => {
                const l = lessons.find(x => x.id === e.target.value);
                if (l) startLesson(l);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700"
            >
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {!hasSubmitted ? (
              <button
                onClick={handleValidate}
                disabled={selectedAnswers.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white disabled:opacity-40 transition"
              >
                Valider
              </button>
            ) : !isFinished ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition"
              >
                <span>Question suivante</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
