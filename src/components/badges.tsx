import type { StageStatus, BookPhase } from "@/lib/api";

const STAGE: Record<StageStatus, { label: string; tone: string }> = {
  pending_notes: { label: "Awaiting notes", tone: "bg-amber-100 text-amber-900 border-amber-300" },
  pending_review: { label: "Needs review", tone: "bg-amber-100 text-amber-900 border-amber-300" },
  outline_review: { label: "Outline review", tone: "bg-amber-100 text-amber-900 border-amber-300" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  no_notes_needed: { label: "Cleared", tone: "bg-emerald-100 text-emerald-900 border-emerald-300" },
};

const PHASE: Record<BookPhase, string> = {
  outline: "Outline",
  chapters: "Drafting",
  completed: "Completed",
};

export function StageBadge({ status }: { status: StageStatus }) {
  const s = STAGE[status] ?? { label: status, tone: "bg-muted text-foreground border-border" };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.tone}`}
    >
      {s.label}
    </span>
  );
}

export function PhaseBadge({ phase }: { phase: BookPhase }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs uppercase tracking-wider text-muted-foreground">
      {PHASE[phase]}
    </span>
  );
}
