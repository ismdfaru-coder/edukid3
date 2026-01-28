import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { useQuestion, useSubmitAnswer } from "@/hooks/use-learning";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Check, X, Clock, Trophy, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

type GamePhase = "question" | "game" | "result" | "loading";

const GAME_DURATION = 5000;

const gameBackgrounds: Record<string, string> = {
  racing: "from-red-900 to-orange-900",
  rocket: "from-indigo-900 to-purple-900",
  puzzle: "from-teal-900 to-cyan-900",
  adventure: "from-amber-900 to-red-900",
};

export default function GameEngine() {
  const [, params] = useRoute("/student/play/:topicId");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const gameType = searchParams.get("game") || "racing";
  const topicId = Number(params?.topicId);
  
  const { data: question, isLoading, refetch, isFetching } = useQuestion(topicId);
  const { mutate: submitAnswer, isPending: isSubmitting } = useSubmitAnswer();

  const [phase, setPhase] = useState<GamePhase>("question");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; message: string; coinsEarned: number } | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameProgress, setGameProgress] = useState(0);

  useEffect(() => {
    if (question && phase === "question") {
      setStartTime(Date.now());
      setSelectedAnswer(null);
      setResult(null);
    }
  }, [question, phase]);

  useEffect(() => {
    if (phase === "game") {
      const interval = setInterval(() => {
        setGameProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase("question");
            refetch();
            return 0;
          }
          return prev + 2;
        });
      }, GAME_DURATION / 50);

      return () => clearInterval(interval);
    }
  }, [phase, refetch]);

  const handleAnswer = useCallback((answer: string) => {
    if (result || phase !== "question") return;
    
    setSelectedAnswer(answer);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    submitAnswer(
      { questionId: question!.id, answer, timeTaken },
      {
        onSuccess: (data) => {
          setResult({
            correct: data.correct,
            message: data.correct ? "Correct!" : "Not quite...",
            coinsEarned: data.coinsEarned
          });

          if (data.correct) {
            setScore(prev => prev + 10 + (streak * 2));
            setStreak(prev => prev + 1);
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 }
            });
          } else {
            setStreak(0);
          }
          
          setQuestionsAnswered(prev => prev + 1);
          setPhase("result");
        }
      }
    );
  }, [question, result, phase, startTime, streak, submitAnswer]);

  const handleContinue = () => {
    if (questionsAnswered % 3 === 0 && questionsAnswered > 0) {
      setPhase("game");
      setGameProgress(0);
      setResult(null); // Clear result immediately
    } else {
      setPhase("loading");
      setResult(null); // Clear result immediately
      refetch().then(() => {
        setPhase("question");
      });
    }
  };

  if (isLoading || isFetching || !question) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-br", gameBackgrounds[gameType] || "from-slate-900 to-slate-800")}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-white" />
        </motion.div>
        <p className="font-display text-2xl mt-4 animate-pulse">Loading...</p>
      </div>
    );
  }

  const allOptions = [question.correctAnswer, ...(question.distractors as string[])].sort(() => Math.random() - 0.5);

  return (
    <div className={cn("min-h-screen relative overflow-hidden flex flex-col bg-gradient-to-br", gameBackgrounds[gameType] || "from-slate-900 to-slate-800")}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl top-10 right-10 animate-pulse" />
        <div className="absolute w-64 h-64 bg-white/5 rounded-full blur-3xl bottom-10 left-10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <header className="relative z-10 p-4 flex justify-between items-center text-white">
        <button 
          onClick={() => setLocation("/student/dashboard")}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-sm transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">{streak}x Streak</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">{score} pts</span>
          </div>
        </div>
        
        <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-bold">Q{questionsAnswered + 1}</span>
        </div>
      </header>

      <main className="flex-1 relative z-10 container max-w-4xl mx-auto p-4 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === "game" && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center w-full"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 text-white relative overflow-hidden min-h-[400px] flex flex-col justify-center">
                {/* Dynamic Game Scene */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  {gameType === "racing" && (
                    <div className="absolute bottom-0 w-full h-1/4 bg-slate-700">
                      <div className="w-full h-2 border-t-2 border-dashed border-white/50 mt-4" />
                    </div>
                  )}
                  {gameType === "rocket" && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
                  )}
                </div>

                <motion.div
                  className="text-9xl mb-12 relative z-10"
                  animate={
                    gameType === "racing" ? {
                      x: [-20, 20, -20],
                      y: [0, -5, 0],
                      rotate: [0, 2, -2, 0]
                    } : gameType === "rocket" ? {
                      y: [0, -30, 0],
                      scale: [1, 1.1, 1],
                      rotate: [0, 1, -1, 0]
                    } : {
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.2, 1]
                    }
                  }
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {gameType === "racing" ? "🏎️" : 
                   gameType === "rocket" ? "🚀" : 
                   gameType === "puzzle" ? "🧩" : "⚔️"}
                </motion.div>
                
                <h2 className="text-4xl font-display font-bold mb-4 relative z-10">
                  {gameType === "racing" ? "Speeding Ahead!" : 
                   gameType === "rocket" ? "Lifting Off!" : 
                   gameType === "puzzle" ? "Solving..." : "Leveling Up!"}
                </h2>
                
                <div className="max-w-md mx-auto w-full space-y-4 relative z-10">
                  <div className="h-6 bg-white/20 rounded-full overflow-hidden border-2 border-white/30">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${gameProgress}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>
                  <p className="text-xl font-bold text-white/90">Powering Up: {Math.round(gameProgress)}%</p>
                </div>
              </div>
            </motion.div>
          )}

          {(phase === "question" || phase === "result") && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-8">
                <h2 className="text-2xl md:text-4xl font-display font-bold text-center leading-relaxed">
                  {question.content}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {allOptions.map((option, idx) => {
                  let statusClass = "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105";
                  
                  if (result && option === question.correctAnswer) {
                    statusClass = "bg-green-500/90 border-green-400 ring-4 ring-green-400/50 scale-105";
                  } else if (result && selectedAnswer === option && !result.correct) {
                    statusClass = "bg-red-500/90 border-red-400 scale-95";
                  } else if (result) {
                    statusClass = "opacity-40 bg-white/5 border-transparent scale-95";
                  }

                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleAnswer(option)}
                      disabled={!!result}
                      className={cn(
                        "p-6 rounded-2xl border-2 text-xl md:text-2xl font-bold text-white transition-all duration-300 text-center relative overflow-hidden",
                        statusClass
                      )}
                    >
                      <span className="relative z-10">{option}</span>
                      {result && option === question.correctAnswer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <Check className="w-8 h-8 text-white" />
                        </motion.div>
                      )}
                      {result && selectedAnswer === option && !result.correct && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-8 h-8 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 w-full bg-white text-slate-900 p-6 md:p-8 rounded-t-3xl shadow-2xl z-20"
            >
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl",
                      result.correct ? "bg-green-500" : "bg-red-500"
                    )}
                  >
                    {result.correct ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold font-display">{result.message}</h3>
                    {result.correct && (
                      <p className="text-green-600 font-bold">+{result.coinsEarned} coins earned!</p>
                    )}
                    {!result.correct && question.explanation && (
                      <p className="text-slate-500 text-sm mt-1">{question.explanation}</p>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinue}
                  className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl hover:shadow-xl transition-all"
                >
                  {questionsAnswered % 3 === 0 && questionsAnswered > 0 ? "Play Game! 🎮" : "Next Question →"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
