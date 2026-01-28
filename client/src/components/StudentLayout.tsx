import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LogOut, 
  Rocket, 
  Home, 
  Gamepad2, 
  Trophy 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/student/dashboard", icon: Home, label: "My Room" },
    { href: "/student/mission-control", icon: Rocket, label: "Missions" },
    { href: "/student/achievements", icon: Trophy, label: "Awards" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-200">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-indigo-100 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-display text-xl">
              EK
            </div>
            <h1 className="font-display text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              EduKid
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-bold flex items-center gap-2 border border-amber-200 shadow-sm">
              <span className="text-lg">🪙</span>
              <span>{user?.coins || 0}</span>
            </div>
            
            <button 
              onClick={() => logout()}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Mobile Navigation / Floating Desktop Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg shadow-indigo-500/10 border border-indigo-100 p-2 flex items-center gap-2 z-50">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "px-6 py-3 rounded-full flex flex-col items-center gap-1 transition-all cursor-pointer min-w-[80px]",
              location === item.href 
                ? "bg-indigo-600 text-white shadow-md transform -translate-y-1" 
                : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
            )}>
              <item.icon className={cn("w-6 h-6", location === item.href && "animate-bounce")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
