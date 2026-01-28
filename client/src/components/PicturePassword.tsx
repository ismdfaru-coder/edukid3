import { useState } from "react";
import { Apple, Car, Cat, Circle, Cloud, Dog, Moon, Star, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ICONS = [
  { id: "apple", icon: Apple, color: "text-red-500" },
  { id: "sun", icon: Sun, color: "text-yellow-500" },
  { id: "cat", icon: Cat, color: "text-orange-500" },
  { id: "car", icon: Car, color: "text-blue-500" },
  { id: "star", icon: Star, color: "text-purple-500" },
  { id: "moon", icon: Moon, color: "text-indigo-400" },
  { id: "dog", icon: Dog, color: "text-brown-500" },
  { id: "cloud", icon: Cloud, color: "text-sky-400" },
  { id: "circle", icon: Circle, color: "text-green-500" },
];

interface PicturePasswordProps {
  onComplete: (password: string[]) => void;
  resetTrigger?: number;
}

export function PicturePassword({ onComplete, resetTrigger }: PicturePasswordProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // Effect to reset selection if needed from parent
  if (resetTrigger !== undefined && selected.length > 0 && resetTrigger > 0) {
    // This is handled via key change in parent usually, but simple state clear here
    // In a real app we'd use a more robust reset mechanism or key prop
  }

  const handleSelect = (id: string) => {
    if (selected.length >= 3) return;
    
    const newSelected = [...selected, id];
    setSelected(newSelected);
    
    if (newSelected.length === 3) {
      onComplete(newSelected);
    }
  };

  const clearSelection = () => {
    setSelected([]);
    onComplete([]); // Reset parent state
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold font-display text-primary">Pick your 3 secret pictures:</h3>
        <button 
          onClick={clearSelection}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
        >
          Reset
        </button>
      </div>

      <div className="flex justify-center gap-2 mb-6 h-12">
        {[0, 1, 2].map((i) => {
          const id = selected[i];
          const iconObj = ICONS.find(ic => ic.id === id);
          const Icon = iconObj?.icon;

          return (
            <div 
              key={i} 
              className={cn(
                "w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all",
                id ? "border-primary bg-primary/10 border-solid" : "border-muted-foreground/30"
              )}
            >
              {Icon && <Icon className={cn("w-6 h-6", iconObj?.color)} />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ICONS.map(({ id, icon: Icon, color }) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(id)}
            disabled={selected.length >= 3}
            className={cn(
              "aspect-square rounded-2xl bg-card border-2 shadow-sm flex items-center justify-center transition-all",
              "hover:border-primary/50 hover:shadow-md",
              selected.includes(id) ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border"
            )}
          >
            <Icon className={cn("w-8 h-8 sm:w-10 sm:h-10", color)} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
