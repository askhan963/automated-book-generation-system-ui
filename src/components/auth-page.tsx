import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export const authSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AuthValues = z.infer<typeof authSchema>;
type AuthMode = "login" | "register";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AuthValues) {
    try {
      if (isLogin) {
        await login(values.email, values.password);
        toast.success("Welcome back");
      } else {
        await register(values.email, values.password);
        toast.success("Your account is ready");
      }
      await navigate({ to: "/library" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Authentication failed",
      );
    }
  }

  if (user) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Already signed in
          </p>
          <h1 className="mt-3 font-display text-4xl">Your desk is ready</h1>
          <p className="mt-3 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link to="/library">Go to Library</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                void navigate({ to: "/" });
              }}
            >
              Log out
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-12 px-6 py-16 md:grid-cols-2">
      <section>
        <span className="inline-grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </span>
        <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
          Quill studio
        </p>
        <h1 className="mt-2 font-display text-5xl">
          {isLogin
            ? "Return to your manuscript"
            : "Begin your writing practice"}
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          {isLogin
            ? "Sign in to continue."
            : "Create an account to keep every outline, chapter, and revision together."}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete={
                        isLogin ? "current-password" : "new-password"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="animate-spin" />
              )}
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "New to Quill?" : "Already have an account?"}{" "}
          <Link
            to={isLogin ? "/register" : "/login"}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
