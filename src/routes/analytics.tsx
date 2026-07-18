import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Quill" },
      {
        name: "description",
        content: "Writing style and token usage for your manuscripts.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <RequireAuth>
      <AnalyticsContent />
    </RequireAuth>
  );
}

function distributionEntries(dist: Record<string, number>) {
  return Object.entries(dist)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function AnalyticsContent() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: api.stats,
  });

  if (isLoading) {
    return (
      <main className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading analytics…
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-5xl">Analytics</h1>
        <p className="mt-4 text-muted-foreground">
          {error instanceof Error ? error.message : "Couldn't load analytics."}
        </p>
        <Button
          className="mt-6"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching && <Loader2 className="animate-spin" />}
          Try again
        </Button>
      </main>
    );
  }

  const styles = data.writing_style_analytics;
  const distributions = [
    ["Genre", styles.genre_distribution],
    ["Tone", styles.tone_distribution],
    ["Audience", styles.audience_distribution],
    ["Length", styles.length_distribution],
  ] as const;

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-16">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Your studio
        </p>
        <h1 className="font-display text-5xl">Analytics</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Totals, style mix, and estimated token trends for the books you own.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Books" value={String(data.total_books)} />
        <StatCard label="Chapters" value={String(data.total_chapters)} />
        <StatCard
          label="Tokens (listed)"
          value={String(
            data.books.reduce((sum, b) => sum + b.estimated_token_usage, 0),
          )}
        />
        <StatCard
          label="Avg chapters / book"
          value={
            data.total_books === 0
              ? "—"
              : (data.total_chapters / data.total_books).toFixed(1)
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {distributions.map(([title, dist]) => {
          const entries = distributionEntries(dist);
          return (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="font-display text-2xl font-normal">
                  {title}
                </CardTitle>
                <CardDescription>
                  Distribution across your books
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {entries.map(({ label, count }) => (
                      <li
                        key={label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize text-foreground">
                          {label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl font-normal">
            Token trends
          </CardTitle>
          <CardDescription>Estimated tokens by day</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {data.token_consumption_trends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trend data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.token_consumption_trends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="estimated_tokens"
                  stroke="oklch(0.45 0.08 50)"
                  fill="oklch(0.85 0.04 80)"
                  name="Tokens"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl font-normal">
            Books
          </CardTitle>
          <CardDescription>
            Per-manuscript chapter and token estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.books.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.books.map((b) => (
                <li
                  key={b.book_id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                >
                  <span className="font-display text-xl">{b.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {b.chapters_count} chapters · {b.estimated_token_usage}{" "}
                    tokens
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-display text-4xl font-normal tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
