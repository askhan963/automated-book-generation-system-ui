import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookMarked } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Quill" },
      { name: "description", content: "Your in-progress manuscripts." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <RequireAuth>
      <LibraryContent />
    </RequireAuth>
  );
}

function LibraryContent() {
  const { data: books = [], isLoading } = useQuery({
    queryKey: queryKeys.books,
    queryFn: () => api.listBooks(),
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-muted-foreground">Loading books...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Your shelf
          </p>
          <h1 className="font-display text-5xl">Library</h1>
        </div>
        <Link
          to="/"
          className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          New book
        </Link>
      </header>

      {books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-2xl">The shelf is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Books you start will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {books.map((b) => (
            <li key={b.id}>
              <Link
                to="/books/$bookId"
                params={{ bookId: b.id }}
                className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="font-display text-2xl">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(b.updated_at).toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
