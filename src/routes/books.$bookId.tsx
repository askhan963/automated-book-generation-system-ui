import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  FileText,
  FileJson,
  File,
} from "lucide-react";

import {
  downloadAsText,
  downloadBlob,
  exportToDocs,
  exportToPdf,
} from "@/lib/export";
import {
  api,
  type BookResponse,
  type ChapterResponse,
  type ExportFormat,
  type StageStatus,
  resolveExportUrl,
  parseContentDispositionFilename,
} from "@/lib/api";
import { rememberBook } from "@/lib/recent-books";
import { queryKeys } from "@/lib/query-keys";
import { invalidateBookCaches } from "@/lib/query-invalidation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StageBadge, PhaseBadge } from "@/components/badges";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/books/$bookId")({
  head: () => ({ meta: [{ title: "Workspace — Quill" }] }),
  component: BookWorkspace,
});

type View = "outline" | "chapters" | "draft" | "publish";

function BookWorkspace() {
  return (
    <RequireAuth>
      <BookWorkspaceContent />
    </RequireAuth>
  );
}

function BookWorkspaceContent() {
  const { bookId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const bookQ = useQuery({
    queryKey: queryKeys.book(bookId),
    queryFn: () => api.getBook(bookId),
    refetchOnWindowFocus: false,
  });
  const chaptersQ = useQuery({
    queryKey: queryKeys.chapters(bookId),
    queryFn: () => api.listChapters(bookId),
    enabled: !!bookQ.data,
  });

  const book = bookQ.data;
  const chapters = chaptersQ.data ?? [];

  useEffect(() => {
    if (book && user) rememberBook(user.id, book);
  }, [book, user]);

  const [view, setView] = useState<View>("outline");
  useEffect(() => {
    if (!book) return;
    if (book.phase === "outline") setView("outline");
    else if (book.phase === "chapters") setView("chapters");
    else setView("publish");
  }, [book?.phase]);

  if (bookQ.isLoading) {
    return (
      <main className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening manuscript…
      </main>
    );
  }
  if (bookQ.error || !book) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="font-display text-4xl">Book not found</h1>
        <p className="mt-2 text-muted-foreground">
          {(bookQ.error as Error)?.message ?? "We couldn't load this book."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Start a new book
        </Link>
      </main>
    );
  }

  const outlineTotal = book.outline?.chapters.length ?? 0;
  const generatedCount = chapters.length;
  const allGenerated = outlineTotal > 0 && generatedCount >= outlineTotal;
  const allApproved =
    allGenerated &&
    chapters.every(
      (c) => c.status === "approved" || c.status === "no_notes_needed",
    );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <button
            onClick={() => navigate({ to: "/library" })}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Library
          </button>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">
            {book.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={book.phase} />
            <StageBadge status={book.outline_status} />
            {outlineTotal > 0 && (
              <span className="text-xs text-muted-foreground">
                {generatedCount} / {outlineTotal} chapters
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Started {new Date(book.created_at).toLocaleDateString()}</p>
          <p>Updated {new Date(book.updated_at).toLocaleString()}</p>
        </div>
      </header>

      <div className="grid gap-10 md:grid-cols-[200px_1fr]">
        <nav className="space-y-1 md:sticky md:top-24 md:self-start">
          <Step
            n="01"
            label="Outline"
            active={view === "outline"}
            done={book.phase !== "outline"}
            onClick={() => setView("outline")}
          />
          <Step
            n="02"
            label="Chapters"
            active={view === "chapters"}
            done={allApproved}
            onClick={() => setView("chapters")}
            disabled={book.phase === "outline"}
          />
          <Step
            n="03"
            label="Draft"
            active={view === "draft"}
            done={false}
            onClick={() => setView("draft")}
            disabled={generatedCount === 0}
          />
          <Step
            n="04"
            label="Publish"
            active={view === "publish"}
            done={book.phase === "completed"}
            onClick={() => setView("publish")}
            disabled={!allApproved}
          />
        </nav>

        <div className="min-w-0">
          {view === "outline" && (
            <OutlineView
              book={book}
              onChange={() => void invalidateBookCaches(qc, bookId)}
            />
          )}
          {view === "chapters" && (
            <ChaptersView book={book} chapters={chapters} bookId={bookId} />
          )}
          {view === "draft" && <DraftView bookId={bookId} />}
          {view === "publish" && (
            <PublishView
              book={book}
              allApproved={allApproved}
              chaptersCount={generatedCount}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function Step({
  n,
  label,
  active,
  done,
  disabled,
  onClick,
}: {
  n: string;
  label: string;
  active: boolean;
  done: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : disabled
            ? "text-muted-foreground/50"
            : "hover:bg-muted"
      }`}
    >
      <span
        className={`font-display text-lg ${active ? "" : done ? "text-emerald-600" : "text-clay"}`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : n}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

/* ----------------------------- Outline view ----------------------------- */

function OutlineView({
  book,
  onChange,
}: {
  book: BookResponse;
  onChange: () => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(book.human_notes ?? "");

  const approve = useMutation({
    mutationFn: (status: StageStatus) =>
      api.reviewOutline(book.id, { human_notes: notes, status }),
    onSuccess: (b) => {
      qc.setQueryData(queryKeys.book(book.id), b);
      void invalidateBookCaches(qc, book.id);
      toast.success(
        b.outline_status === "approved" ||
          b.outline_status === "no_notes_needed"
          ? "Outline approved"
          : "Notes saved",
      );
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const outline = book.outline?.chapters ?? [];
  const isApproved =
    book.outline_status === "approved" ||
    book.outline_status === "no_notes_needed";

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Step 01
          </p>
          <h2 className="font-display text-4xl">Outline review</h2>
        </div>
        <StageBadge status={book.outline_status} />
      </div>

      <ol className="space-y-3">
        {outline.map((c) => (
          <li
            key={c.chapter_number}
            className="group flex gap-5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-clay/60"
          >
            <span className="font-display text-3xl leading-none text-clay">
              {String(c.chapter_number).padStart(2, "0")}
            </span>
            <div className="space-y-1">
              <p className="font-display text-xl">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.brief}</p>
            </div>
          </li>
        ))}
        {outline.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No outline yet.
          </li>
        )}
      </ol>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Notes for revision
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="e.g. Tighten chapter 3; add more foreshadowing in chapter 1."
          className="resize-none border-border bg-secondary/40"
        />
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            disabled={approve.isPending || !notes.trim()}
            onClick={() => approve.mutate("pending_notes")}
          >
            Save notes
          </Button>
          <Button
            disabled={approve.isPending}
            onClick={() => approve.mutate("approved")}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {approve.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isApproved ? "Re-approve outline" : "Approve outline"}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Chapters view ----------------------------- */

function ChaptersView({
  book,
  chapters,
  bookId,
}: {
  book: BookResponse;
  chapters: ChapterResponse[];
  bookId: string;
}) {
  const qc = useQueryClient();
  const outline = book.outline?.chapters ?? [];
  const generatedNums = new Set(chapters.map((c) => c.chapter_number));
  const nextOutline = outline.find((c) => !generatedNums.has(c.chapter_number));

  const [selectedId, setSelectedId] = useState<string | null>(
    chapters[0]?.id ?? null,
  );
  useEffect(() => {
    if (!selectedId && chapters[0]) setSelectedId(chapters[0].id);
  }, [chapters, selectedId]);

  const selected = chapters.find((c) => c.id === selectedId) ?? null;

  const nextMut = useMutation({
    mutationFn: () => api.nextChapter(bookId),
    onSuccess: (ch) => {
      void invalidateBookCaches(qc, bookId);
      setSelectedId(ch.id);
      toast.success(`Chapter ${ch.chapter_number} drafted`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const outlineReady =
    book.outline_status === "approved" ||
    book.outline_status === "no_notes_needed";

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Step 02
          </p>
          <h2 className="font-display text-4xl">Chapters</h2>
        </div>
        {nextOutline && outlineReady && (
          <Button
            disabled={nextMut.isPending}
            onClick={() => nextMut.mutate()}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {nextMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Draft chapter {nextOutline.chapter_number}
          </Button>
        )}
      </div>

      {!outlineReady && (
        <div className="rounded-xl border border-amber-300 bg-amber-100/60 px-4 py-3 text-sm text-amber-900">
          Approve the outline before drafting chapters.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="space-y-1.5">
          {outline.map((o) => {
            const ch = chapters.find(
              (c) => c.chapter_number === o.chapter_number,
            );
            const isSel = ch && ch.id === selectedId;
            return (
              <button
                key={o.chapter_number}
                onClick={() => ch && setSelectedId(ch.id)}
                disabled={!ch}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSel
                    ? "border-foreground bg-card"
                    : ch
                      ? "border-border bg-card/60 hover:bg-card"
                      : "border-dashed border-border/60 bg-transparent text-muted-foreground"
                }`}
              >
                <span className="font-display text-xl text-clay">
                  {String(o.chapter_number).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.title}</p>
                  {ch ? (
                    <div className="mt-1">
                      <StageBadge status={ch.status} />
                    </div>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Not drafted
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        <div className="min-w-0">
          {selected ? (
            <ChapterEditor chapter={selected} bookId={bookId} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-display text-2xl">
                No chapter drafted yet
              </p>
              <p className="text-sm text-muted-foreground">
                Use “Draft chapter” to generate the first chapter from the
                outline.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChapterEditor({
  chapter,
  bookId,
}: {
  chapter: ChapterResponse;
  bookId: string;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(chapter.human_notes ?? "");

  useEffect(() => {
    setNotes(chapter.human_notes ?? "");
  }, [chapter.id]);

  const approve = useMutation({
    mutationFn: (status: StageStatus) =>
      api.reviewChapter(chapter.id, { human_notes: notes, status }),
    onSuccess: (c) => {
      qc.setQueryData(
        queryKeys.chapters(bookId),
        (prev: ChapterResponse[] = []) =>
          prev.map((x) => (x.id === c.id ? c : x)),
      );
      void invalidateBookCaches(qc, bookId);
      toast.success("Chapter approved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regen = useMutation({
    mutationFn: async () => {
      // save notes first so the regeneration uses them
      if (notes !== (chapter.human_notes ?? "")) {
        await api.reviewChapter(chapter.id, {
          human_notes: notes,
          status: chapter.status,
        });
      }
      return api.regenerateChapter(chapter.id);
    },
    onSuccess: (c) => {
      qc.setQueryData(
        queryKeys.chapters(bookId),
        (prev: ChapterResponse[] = []) =>
          prev.map((x) => (x.id === c.id ? c : x)),
      );
      void invalidateBookCaches(qc, bookId);
      toast.success("Chapter regenerated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Chapter {chapter.chapter_number}
          </p>
          <h3 className="font-display text-3xl">{chapter.title}</h3>
        </div>
        <StageBadge status={chapter.status} />
      </header>

      {chapter.summary && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
            Summary
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {chapter.summary}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="prose-quill mx-auto max-w-2xl whitespace-pre-wrap font-serif text-[1.05rem] leading-[1.8] text-foreground">
          {chapter.content || (
            <p className="italic text-muted-foreground">No content yet.</p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Revision notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What should the AI change on the next pass?"
          className="resize-none border-border bg-secondary/40"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            disabled={regen.isPending}
            onClick={() => regen.mutate()}
          >
            {regen.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate with notes
          </Button>
          <Button
            disabled={approve.isPending}
            onClick={() => approve.mutate("approved")}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {approve.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve chapter
          </Button>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------- Draft view ----------------------------- */

function DraftView({ bookId }: { bookId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.draft(bookId),
    queryFn: () => api.getDraft(bookId),
  });

  const bookQ = useQuery({
    queryKey: queryKeys.book(bookId),
    queryFn: () => api.getBook(bookId),
  });

  const [editedContent, setEditedContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (data?.full_text && !editedContent) {
      setEditedContent(data.full_text);
    }
  }, [data?.full_text, editedContent]);

  const handleDownloadTxt = () => {
    try {
      const content = editedContent || data?.full_text || "";
      downloadAsText(content, `${bookQ.data?.title || "manuscript"}.txt`);
      toast.success("Downloaded as TXT");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDownloadDocs = async () => {
    try {
      setIsExporting(true);
      const content = editedContent || data?.full_text || "";
      await exportToDocs(
        bookQ.data?.title || "Manuscript",
        content,
        bookQ.data?.title || "manuscript",
      );
      toast.success("Downloaded as DOCX");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const content = editedContent || data?.full_text || "";
      exportToPdf(
        bookQ.data?.title || "Manuscript",
        content,
        bookQ.data?.title || "manuscript",
      );
      toast.success("Downloaded as PDF");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Step 03
          </p>
          <h2 className="font-display text-4xl">Full draft</h2>
        </div>
        {data && (
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Done editing" : "Edit draft"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Assembling manuscript…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : data ? (
        <>
          {isEditing ? (
            <RichTextEditor
              value={editedContent}
              onChange={setEditedContent}
              placeholder="Edit your manuscript here..."
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
              <pre className="whitespace-pre-wrap font-serif text-[1.02rem] leading-[1.8] text-foreground">
                {editedContent || data.full_text}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/50 p-4">
            <span className="text-sm font-medium text-muted-foreground">
              Download as:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTxt}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDocs}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <File className="h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}

/* ----------------------------- Publish view ----------------------------- */

function PublishView({
  book,
  allApproved,
  chaptersCount,
}: {
  book: BookResponse;
  allApproved: boolean;
  chaptersCount: number;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(book.human_notes ?? "Ready to publish.");

  const clear = useMutation({
    mutationFn: () =>
      api.finalReview(book.id, {
        human_notes: notes,
        status: "no_notes_needed",
      }),
    onSuccess: (b) => {
      qc.setQueryData(queryKeys.book(book.id), b);
      void invalidateBookCaches(qc, book.id);
      toast.success("Final review cleared");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canDownload = book.final_review_notes_status === "no_notes_needed";
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null);

  const downloadCompile = async () => {
    try {
      setDownloadBusy("compile");
      const { blob, filename } = await api.compileBook(book.id);
      downloadBlob(blob, filename ?? `${book.title}.txt`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadBusy(null);
    }
  };

  const downloadExport = async (format: ExportFormat) => {
    const extensions: Record<ExportFormat, string> = {
      pdf: "pdf",
      epub: "epub",
      markdown: "md",
      html: "html",
    };
    try {
      setDownloadBusy(format);
      const { url } = await api.exportBook(book.id, format);
      const absolute = resolveExportUrl(url);
      const res = await fetch(absolute);
      if (!res.ok) {
        throw new Error(`Export download failed (${res.status})`);
      }
      const blob = await res.blob();
      const filename =
        parseContentDispositionFilename(
          res.headers.get("Content-Disposition"),
        ) ?? `${book.title}.${extensions[format]}`;
      downloadBlob(blob, filename);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setDownloadBusy(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Step 04
          </p>
          <h2 className="font-display text-4xl">Sign off & compile</h2>
        </div>
        <StageBadge status={book.final_review_notes_status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Chapters" value={String(chaptersCount)} />
        <Stat label="All approved" value={allApproved ? "Yes" : "Not yet"} />
        <Stat label="Phase" value={book.phase} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Closing notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none border-border bg-secondary/40"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            disabled={clear.isPending || !allApproved}
            onClick={() => clear.mutate()}
            variant="outline"
          >
            {clear.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Clear final review
          </Button>
          <Button
            disabled={!canDownload || downloadBusy !== null}
            onClick={() => void downloadCompile()}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {downloadBusy === "compile" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download manuscript
          </Button>
        </div>
        {canDownload && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            {(
              [
                ["pdf", "PDF"],
                ["epub", "EPUB"],
                ["markdown", "Markdown"],
                ["html", "HTML"],
              ] as const
            ).map(([format, label]) => (
              <Button
                key={format}
                type="button"
                variant="outline"
                size="sm"
                disabled={downloadBusy !== null}
                onClick={() => void downloadExport(format)}
              >
                {downloadBusy === format ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Export {label}
              </Button>
            ))}
          </div>
        )}
        {!allApproved && (
          <p className="text-right text-xs text-muted-foreground">
            Approve every chapter before clearing final review.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl capitalize">{value}</p>
    </div>
  );
}
