import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import StudentDashboard from "@/pages/student/Dashboard";
import MissionControl from "@/pages/student/MissionControl";
import GameEngine from "@/pages/student/GameEngine";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Protected Route Component
function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType<any>;
  allowedRoles: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = "/";
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard">
        {() => <ProtectedRoute component={StudentDashboard} allowedRoles={['student']} />}
      </Route>
      <Route path="/student/mission-control">
        {() => <ProtectedRoute component={MissionControl} allowedRoles={['student']} />}
      </Route>
      <Route path="/student/play/:topicId">
        {() => <ProtectedRoute component={GameEngine} allowedRoles={['student']} />}
      </Route>
      
      {/* Teacher Routes */}
      <Route path="/teacher/dashboard">
        {() => <ProtectedRoute component={TeacherDashboard} allowedRoles={['teacher']} />}
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
