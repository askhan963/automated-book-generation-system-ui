export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://automated-book-generation-system-production.up.railway.app/api/v1";

export type StageStatus =
  | "pending_notes"
  | "pending_review"
  | "outline_review"
  | "approved"
  | "no_notes_needed";

export type BookPhase = "outline" | "chapters" | "completed";

export interface OutlineChapter {
  chapter_number: number;
  title: string;
  brief: string;
}

export interface BookResponse {
  id: string;
  title: string;
  initial_notes: string | null;
  outline: { chapters: OutlineChapter[] } | null;
  outline_status: StageStatus;
  final_review_notes_status: StageStatus;
  phase: BookPhase;
  human_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChapterResponse {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  summary: string | null;
  status: StageStatus;
  human_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookDraftResponse {
  book: BookResponse;
  chapters: ChapterResponse[];
  full_text: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  supabase: { status: string; detail: string | null };
  openrouter: { status: string; detail: string | null };
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (json !== undefined) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail =
        typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((d: { msg?: string }) => d.msg).join(", ")
            : JSON.stringify(data.detail ?? data);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  listBooks: () => request<BookResponse[]>("/books"),

  generateOutline: (body: { title: string; notes?: string }) =>
    request<BookResponse>("/generate-outline", { method: "POST", json: body }),

  getBook: (id: string) => request<BookResponse>(`/books/${id}`),

  reviewOutline: (
    id: string,
    body: { human_notes: string; status?: StageStatus },
  ) =>
    request<BookResponse>(`/books/${id}/outline`, {
      method: "PATCH",
      json: body,
    }),

  finalReview: (
    id: string,
    body: { human_notes?: string; status?: StageStatus },
  ) =>
    request<BookResponse>(`/books/${id}/final-review`, {
      method: "PATCH",
      json: body,
    }),

  nextChapter: (id: string) =>
    request<ChapterResponse>(`/books/${id}/chapters/next`, { method: "POST" }),

  listChapters: (id: string) =>
    request<ChapterResponse[]>(`/books/${id}/chapters`),

  getDraft: (id: string) => request<BookDraftResponse>(`/books/${id}/draft`),

  reviewChapter: (
    id: string,
    body: { human_notes?: string; status?: StageStatus },
  ) =>
    request<ChapterResponse>(`/chapters/${id}`, {
      method: "PATCH",
      json: body,
    }),

  regenerateChapter: (id: string) =>
    request<ChapterResponse>(`/chapters/${id}/regenerate`, { method: "POST" }),

  compileUrl: (id: string) => `${API_BASE}/books/${id}/compile`,
};

const KEY = "quill.recent-books";
export interface RecentBook {
  id: string;
  title: string;
  updated_at: string;
}
export function getRecentBooks(): RecentBook[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function rememberBook(b: { id: string; title: string }) {
  if (typeof window === "undefined") return;
  const list = getRecentBooks().filter((x) => x.id !== b.id);
  list.unshift({ id: b.id, title: b.title, updated_at: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
}
