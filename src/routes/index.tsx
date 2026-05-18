import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Feather, Loader2, ScrollText, PenLine } from "lucide-react";

import { api, getRecentBooks, rememberBook } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quill — Start a new book" },
      {
        name: "description",
        content:
          "A guided studio for writing a book with AI: outline, draft, review, compile.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const generate = useMutation({
    mutationFn: () => api.generateOutline({ title, notes: notes || undefined }),
    onSuccess: (book) => {
      rememberBook(book);
      toast.success("Outline drafted");
      navigate({ to: "/books/$bookId", params: { bookId: book.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const recent = getRecentBooks();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <section className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Feather className="h-3 w-3" />
            Human in the loop
          </div>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Write a book,
            <br />
            <span className="italic text-clay">one approved</span>
            <br />
            chapter at a time.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Quill drafts an outline, writes chapters, and pauses for your
            judgement at every gate. You stay the author.
          </p>

          <ul className="grid gap-3 pt-4 text-sm text-foreground/80">
            {[
              ["01", "Sketch a premise — title and a few notes."],
              ["02", "Approve or reshape the outline."],
              ["03", "Generate, review, and revise each chapter."],
              ["04", "Sign off and download the manuscript."],
            ].map(([n, t]) => (
              <li key={n} className="flex items-start gap-4">
                <span className="font-display text-2xl text-clay">{n}</span>
                <span className="pt-1">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-sand/60 blur-2xl" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              generate.mutate();
            }}
            className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-[0_30px_80px_-40px_oklch(0.4_0.05_60_/_0.4)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-clay" />
                <span className="font-display text-xl">A new manuscript</span>
              </div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Draft I
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
                Working title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Last Lighthouse"
                maxLength={500}
                required
                className="h-12 border-0 border-b border-border bg-transparent px-0 font-display !text-2xl shadow-none focus-visible:border-foreground focus-visible:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">
                Notes for the AI <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Genre, tone, key characters, themes, structure preferences…"
                rows={6}
                className="resize-none border-border bg-secondary/40"
              />
            </div>

            <Button
              type="submit"
              disabled={generate.isPending || !title.trim()}
              size="lg"
              className="group w-full justify-between rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span className="flex items-center gap-2">
                {generate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScrollText className="h-4 w-4" />
                )}
                {generate.isPending ? "Drafting outline…" : "Draft my outline"}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            {generate.isPending && (
              <p className="text-center text-xs text-muted-foreground">
                This can take 30–90 seconds.
              </p>
            )}
          </form>

          {recent.length > 0 && (
            <div className="mt-8 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Pick up where you left off
              </p>
              <div className="space-y-1.5">
                {recent.slice(0, 4).map((b) => (
                  <button
                    key={b.id}
                    onClick={() =>
                      navigate({ to: "/books/$bookId", params: { bookId: b.id } })
                    }
                    className="group flex w-full items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card"
                  >
                    <span className="font-display text-lg">{b.title}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
