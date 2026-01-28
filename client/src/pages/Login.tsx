import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { PicturePassword } from "@/components/PicturePassword";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GraduationCap, Baby, Users, ArrowRight, Loader2, Rocket } from "lucide-react";
import { loginSchema } from "@shared/routes";
import { motion, AnimatePresence } from "framer-motion";

const studentSchema = loginSchema.pick({ username: true, password: true });
const standardSchema = loginSchema.pick({ username: true, password: true });

interface FloatingNumber {
  id: number;
  value: string;
  x: number;
  y: number;
}

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [role, setRole] = useState<"student" | "teacher" | "parent">("student");
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { username: "", password: "" },
  });

  const standardForm = useForm<z.infer<typeof standardSchema>>({
    resolver: zodResolver(standardSchema),
    defaultValues: { username: "", password: "" },
  });

  const mathSymbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "×", "÷", "=", "π", "∞", "√", "%"];

  const triggerMathAnimation = () => {
    setIsAnimating(true);
    const newNumbers: FloatingNumber[] = [];
    for (let i = 0; i < 20; i++) {
      newNumbers.push({
        id: Date.now() + i,
        value: mathSymbols[Math.floor(Math.random() * mathSymbols.length)],
        x: Math.random() * 200 - 100,
        y: Math.random() * -150 - 50,
      });
    }
    setFloatingNumbers(newNumbers);
    setTimeout(() => {
      setFloatingNumbers([]);
      setIsAnimating(false);
    }, 1500);
  };

  const onStudentSubmit = (data: z.infer<typeof studentSchema>) => {
    triggerMathAnimation();
    setTimeout(() => {
      login({ ...data, role: "student" });
    }, 300);
  };

  const onStandardSubmit = (data: z.infer<typeof standardSchema>) => {
    triggerMathAnimation();
    setTimeout(() => {
      login({ ...data, role });
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10 font-bold text-4xl"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: -50,
              rotate: 0 
            }}
            animate={{ 
              y: window.innerHeight + 50,
              rotate: 360 
            }}
            transition={{ 
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            {mathSymbols[Math.floor(Math.random() * mathSymbols.length)]}
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-[500px] relative z-10">
        <div className="absolute right-[-140px] bottom-0 hidden lg:block">
          <motion.div 
            className="relative w-[180px] h-[220px] bg-gradient-to-b from-orange-400 to-orange-500 rounded-[40px_40px_10px_10px] border-[3px] border-black flex flex-col items-center pt-8 shadow-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex gap-4 mb-2">
              <div className="w-4 h-4 bg-black rounded-full" />
              <div className="w-4 h-4 bg-black rounded-full" />
            </div>
            <div className="w-2 h-2 bg-black rounded-full" />
            <div className="absolute top-[-20px] left-4 w-12 h-16 bg-black rounded-t-full -rotate-12" />
            <div className="absolute top-[-20px] right-4 w-12 h-16 bg-black rounded-t-full rotate-12" />
          </motion.div>
        </div>

        <motion.div 
          className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl overflow-hidden border-[3px] border-white/20 shadow-[0_0_60px_rgba(139,92,246,0.5)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-3 h-16 border-b-[3px] border-white/20">
            <motion.button 
              onClick={() => setRole("student")}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${role === 'student' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-inner' : 'bg-indigo-800/50 text-slate-300 hover:bg-indigo-700/50'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-6 h-6 bg-yellow-400 rounded-sm border-2 border-black flex items-center justify-center text-[10px] text-black font-bold">DOG</div>
              <span className="text-[10px] font-bold uppercase">Student</span>
            </motion.button>
            <motion.button 
              onClick={() => setRole("teacher")}
              className={`flex flex-col items-center justify-center gap-1 transition-all border-x-[3px] border-white/20 ${role === 'teacher' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-inner' : 'bg-indigo-800/50 text-slate-300 hover:bg-indigo-700/50'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GraduationCap className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase">Teacher</span>
            </motion.button>
            <motion.button 
              onClick={() => setRole("parent")}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${role === 'parent' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-inner' : 'bg-indigo-800/50 text-slate-300 hover:bg-indigo-700/50'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase">Parent</span>
            </motion.button>
          </div>

          <div className="p-8 space-y-8">
            <motion.h1 
              className="text-4xl font-black text-white text-center tracking-tighter italic drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              animate={{ 
                textShadow: ["0 0 20px rgba(255,255,255,0.3)", "0 0 40px rgba(255,255,255,0.5)", "0 0 20px rgba(255,255,255,0.3)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PLAY EDUKID!
            </motion.h1>
            
            <div className="space-y-4">
              <Button variant="outline" className="w-full bg-white/90 text-purple-700 border-2 border-white h-10 rounded-xl shadow-lg font-bold hover:bg-white hover:scale-105 transition-transform">
                Log in with MyLogin
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/30"></span>
                </div>
                <span className="relative bg-purple-600 px-4 text-white font-bold text-sm rounded-full">OR</span>
              </div>
            </div>

            <Form {...(role === 'student' ? studentForm : standardForm)}>
              <form 
                onSubmit={role === 'student' ? studentForm.handleSubmit(onStudentSubmit) : standardForm.handleSubmit(onStandardSubmit)} 
                className="space-y-6"
              >
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <label className="text-white font-black text-right text-sm drop-shadow">USERNAME</label>
                  <FormField
                    control={(role === 'student' ? studentForm : standardForm).control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <Input 
                            className="bg-white/95 border-[3px] border-white/50 rounded-xl h-12 text-purple-900 font-bold shadow-lg focus-visible:ring-4 focus-visible:ring-pink-400 focus-visible:border-white transition-all" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-pink-300 font-bold" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <label className="text-white font-black text-right text-sm drop-shadow">PASSWORD</label>
                  <FormField
                    control={(role === 'student' ? studentForm : standardForm).control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="password"
                              className="bg-white/95 border-[3px] border-white/50 rounded-xl h-12 text-purple-900 font-bold shadow-lg focus-visible:ring-4 focus-visible:ring-pink-400 focus-visible:border-white transition-all" 
                              {...field} 
                            />
                          </FormControl>
                          <motion.div 
                            className="absolute right-[-50px] top-0 h-12 w-12 bg-gradient-to-r from-pink-500 to-rose-500 border-[3px] border-white/50 rounded-xl flex items-center justify-center cursor-pointer shadow-lg"
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Baby className="w-6 h-6 text-white" />
                          </motion.div>
                        </div>
                        <FormMessage className="text-pink-300 font-bold" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-center pt-4 relative">
                  <AnimatePresence>
                    {floatingNumbers.map((num) => (
                      <motion.span
                        key={num.id}
                        className="absolute text-2xl font-bold text-yellow-300 pointer-events-none"
                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        animate={{ 
                          opacity: 0, 
                          x: num.x, 
                          y: num.y,
                          scale: 1.5,
                          rotate: Math.random() * 360
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      >
                        {num.value}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white border-[3px] border-white/30 rounded-xl px-12 h-14 font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
                      disabled={isLoggingIn || isAnimating}
                    >
                      <motion.span
                        animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {isLoggingIn ? "LOGGING IN..." : "LOG IN"}
                      </motion.span>
                    </Button>
                  </motion.div>
                </div>
              </form>
            </Form>

            <div className="text-center">
              <motion.button 
                className="text-white/80 font-bold text-sm hover:text-white italic transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                I FORGOT MY LOGIN
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
