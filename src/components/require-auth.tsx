import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isLoading, navigate, user]);

  if (isLoading) {
    return (
      <main className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your session…
      </main>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
