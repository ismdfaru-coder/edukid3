import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart, 
  Settings,
  Baby
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isTeacher = user?.role === 'teacher';

  const teacherNav = [
    { href: "/teacher/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/teacher/classes", icon: Users, label: "My Classes" },
    { href: "/teacher/assignments", icon: BookOpen, label: "Assignments" },
    { href: "/teacher/analytics", icon: BarChart, label: "Analytics" },
  ];

  const parentNav = [
    { href: "/parent/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/parent/children", icon: Baby, label: "Children" },
    { href: "/parent/settings", icon: Settings, label: "Settings" },
  ];

  const navItems = isTeacher ? teacherNav : parentNav;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-display">
            <span className="text-primary text-3xl">✦</span> EduKid
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1 ml-9">
            {isTeacher ? "Teacher Portal" : "Parent Portal"}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                location === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {user?.firstName?.[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 md:hidden p-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-xl font-bold font-display">EduKid</h1>
          <Button size="icon" variant="ghost" onClick={() => logout()}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
