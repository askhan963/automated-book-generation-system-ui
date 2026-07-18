import { clearToken, getToken, notifyUnauthorized } from "@/lib/auth-storage";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://automated-book-generation-system-production.up.railway.app/api/v1";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Build a `?…` query string; omits `undefined` / `null`. */
export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** TanStack Query retry policy: never retry unauthorized responses. */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiError && error.status === 401) return false;
  return failureCount < 3;
}

export type StageStatus =
  | "pending_notes"
  | "pending_review"
  | "outline_review"
  | "approved"
  | "no_notes_needed";

export type BookPhase = "outline" | "chapters" | "completed";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

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

function handleUnauthorized(): void {
  clearToken();
  notifyUnauthorized();
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path === "/login" || path === "/register") return;
  window.location.assign("/login");
}

function flattenDetail(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { msg?: string }) => d.msg)
      .filter(Boolean)
      .join(", ");
  }
  if (detail !== undefined) return JSON.stringify(detail);
  return fallback;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return flattenDetail(data, res.statusText);
  } catch {
    return res.statusText;
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (json !== undefined) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new ApiError(await readErrorMessage(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  register: (body: { email: string; password: string }) =>
    request<User>("/auth/register", { method: "POST", json: body }),

  login: async (email: string, password: string) => {
    const headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers,
      body: new URLSearchParams({ username: email, password }),
    });

    if (!res.ok) {
      throw new ApiError(await readErrorMessage(res), res.status);
    }

    return (await res.json()) as AuthTokenResponse;
  },

  me: () => request<User>("/auth/me"),

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
