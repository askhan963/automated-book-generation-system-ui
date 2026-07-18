import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, LogOut, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();

  function linkClass(active: boolean) {
    return `rounded-full px-4 py-1.5 transition-colors ${
      active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
    }`;
  }

  function handleLogout() {
    logout();
    void navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-paper-grain/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="font-display text-2xl leading-none">
            Quill<span className="italic text-muted-foreground"> studio</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className={linkClass(path === "/")}>
            New book
          </Link>
          {!isLoading && user && (
            <Link
              to="/library"
              className={linkClass(path.startsWith("/library"))}
            >
              Library
            </Link>
          )}
          {!isLoading && user && (
            <Link
              to="/analytics"
              className={linkClass(path.startsWith("/analytics"))}
            >
              Analytics
            </Link>
          )}
          <Link
            to="/status"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Status
          </Link>

          {!isLoading && !user && (
            <>
              <Link to="/login" className={linkClass(path === "/login")}>
                Login
              </Link>
              <Link to="/register" className={linkClass(path === "/register")}>
                Register
              </Link>
            </>
          )}

          {!isLoading && user && (
            <>
              <span
                className="ml-2 max-w-40 truncate px-2 text-muted-foreground"
                title={user.email}
              >
                {user.email}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut />
                Log out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
