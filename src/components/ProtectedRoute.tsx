import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bot } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="relative">
            <Bot className="h-10 w-10 animate-pulse text-primary" />
            <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20" />
          </div>
          <p className="animate-pulse font-medium tracking-wide">Syncing account...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
