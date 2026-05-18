import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "Service status — Quill" }] }),
  component: StatusPage,
});

function dot(status: string) {
  if (status === "ok")
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "degraded")
    return <AlertCircle className="h-5 w-5 text-amber-600" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
}

function StatusPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30_000,
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Diagnostics
      </p>
      <h1 className="mb-2 font-display text-5xl">Service status</h1>
      <p className="text-muted-foreground">Live checks against the Quill API.</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8">
        {isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking…
          </div>
        ) : error ? (
          <div className="text-destructive">{(error as Error).message}</div>
        ) : data ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="font-display text-2xl capitalize">{data.status}</p>
                <p className="text-sm text-muted-foreground">{data.message}</p>
              </div>
              {dot(data.status)}
            </div>
            <Row name="Database (Supabase)" s={data.supabase} />
            <Row name="LLM (OpenRouter)" s={data.openrouter} />
          </div>
        ) : null}

        <button
          onClick={() => refetch()}
          className="mt-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </main>
  );
}

function Row({
  name,
  s,
}: {
  name: string;
  s: { status: string; detail: string | null };
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{name}</p>
        {s.detail && (
          <p className="text-xs text-muted-foreground">{s.detail}</p>
        )}
      </div>
      {dot(s.status)}
    </div>
  );
}
