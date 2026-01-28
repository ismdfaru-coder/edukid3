import { useState } from "react";
import { StudentLayout } from "@/components/StudentLayout";
import { useTopics } from "@/hooks/use-learning";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Loader2, Play, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { id: 1, name: "Science", icon: "🔬", color: "from-blue-500 to-indigo-600" },
  { id: 2, name: "Maths", icon: "🔢", color: "from-purple-500 to-pink-600" },
];

const GAMES = [
  { id: "racing", name: "Number Racing", icon: "🏎️", description: "Race to answer questions!" },
  { id: "rocket", name: "Rocket Launch", icon: "🚀", description: "Blast off with correct answers!" },
  { id: "puzzle", name: "Brain Puzzle", icon: "🧩", description: "Solve puzzles to progress!" },
  { id: "adventure", name: "Math Adventure", icon: "⚔️", description: "Battle with your brain!" },
];

const topicIcons: Record<string, string> = {
  "Electricity": "⚡",
  "Plants": "🌿",
  "Space": "🚀",
  "Addition": "➕",
  "Subtraction": "➖",
  "Multiplication": "✖️",
  "Division": "➗",
  "Fractions": "🍕",
};

const topicColors: Record<string, string> = {
  "Electricity": "from-yellow-400 to-orange-500",
  "Plants": "from-green-400 to-emerald-600",
  "Space": "from-indigo-500 to-purple-700",
  "Addition": "from-blue-400 to-blue-600",
  "Subtraction": "from-red-400 to-red-600",
  "Multiplication": "from-purple-400 to-purple-600",
  "Division": "from-teal-400 to-teal-600",
  "Fractions": "from-orange-400 to-orange-600",
};

export default function MissionControl() {
  const [selectedSubject, setSelectedSubject] = useState<number>(2);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [showGameSelect, setShowGameSelect] = useState(false);
  const { data: topics, isLoading } = useTopics("KS2", selectedSubject);
  const [, setLocation] = useLocation();

  const handleTopicClick = (topicId: number) => {
    setSelectedTopic(topicId);
    setShowGameSelect(true);
  };

  const handleGameSelect = (gameId: string) => {
    if (selectedTopic) {
      setLocation(`/student/play/${selectedTopic}?game=${gameId}`);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-xl font-display text-indigo-400">Loading missions...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <header>
          <h2 className="text-3xl font-display font-bold text-slate-800">Mission Control</h2>
          <p className="text-slate-500 text-lg">Choose a mission to earn coins!</p>
        </header>

        <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl w-fit">
          {SUBJECTS.map((subject) => (
            <motion.button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg transition-all",
                selectedSubject === subject.id
                  ? `bg-gradient-to-r ${subject.color} text-white shadow-lg`
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl">{subject.icon}</span>
              {subject.name}
            </motion.button>
          ))}
        </div>

        <motion.div 
          key={selectedSubject}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {topics?.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-2 hover:border-indigo-400 transition-colors group cursor-pointer relative">
                <div className={cn(
                  "h-32 bg-gradient-to-r flex items-center justify-center",
                  topicColors[topic.name] || "from-slate-200 to-slate-300"
                )}>
                  <span className="text-6xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all">
                    {topicIcons[topic.name] || "📚"}
                  </span>
                </div>
                
                <div className="p-6 relative">
                  <div className="absolute -top-10 left-6 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl border-4 border-white">
                    {topicIcons[topic.name] || "📚"}
                  </div>

                  <div className="mt-8 space-y-4">
                    <div>
                      <h3 className="text-xl font-display font-bold">{topic.name}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2">{topic.description || "Start learning now!"}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>Mastery</span>
                        <span>{Math.round((topic.mastery || 0) * 100)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(topic.mastery || 0) * 100}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleTopicClick(topic.id)}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Play Now
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {showGameSelect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowGameSelect(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
              >
                <div className="text-center mb-8">
                  <Gamepad2 className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
                  <h2 className="text-3xl font-display font-bold text-slate-800">Choose Your Game!</h2>
                  <p className="text-slate-500 mt-2">Pick a game to play while you learn</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {GAMES.map((game, index) => (
                    <motion.button
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleGameSelect(game.id)}
                      className="p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <span className="text-5xl block mb-3 group-hover:scale-110 transition-transform">{game.icon}</span>
                      <h3 className="font-bold text-lg text-slate-800">{game.name}</h3>
                      <p className="text-slate-500 text-sm">{game.description}</p>
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={() => setShowGameSelect(false)}
                  className="mt-6 w-full py-3 text-slate-500 hover:text-slate-700 font-bold"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentLayout>
  );
}
