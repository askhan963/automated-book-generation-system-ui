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

type QueryParamValue = string | number | boolean | null | undefined;

/** Build a `?…` query string; omits `undefined` / `null`. */
export function buildQuery(
  params: Record<string, QueryParamValue> | object,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value as string | number | boolean));
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
  owner_id: string;
  genre: string | null;
  tone: string | null;
  audience: string | null;
  length: string | null;
  created_at: string;
  updated_at: string;
}

/** Optional writing-style hints shared by outline/chapter generation. */
export interface BookStyleFields {
  genre?: string;
  tone?: string;
  audience?: string;
  length?: string;
}

export interface GenerateOutlineBody extends BookStyleFields {
  title: string;
  notes?: string;
}

export interface CreateBookBody extends BookStyleFields {
  title: string;
  initial_notes?: string;
  auto_approve_outline?: boolean;
}

export interface GenerateChapterBody extends BookStyleFields {
  chapter_id: string;
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

export interface StatsBookRow {
  book_id: string;
  title: string;
  chapters_count: number;
  estimated_token_usage: number;
}

export interface WritingStyleAnalytics {
  genre_distribution: Record<string, number>;
  tone_distribution: Record<string, number>;
  audience_distribution: Record<string, number>;
  length_distribution: Record<string, number>;
}

export interface TokenTrendPoint {
  date: string;
  estimated_tokens: number;
}

export interface StatsResponse {
  total_books: number;
  total_chapters: number;
  books: StatsBookRow[];
  writing_style_analytics: WritingStyleAnalytics;
  token_consumption_trends: TokenTrendPoint[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectBody {
  name: string;
  description?: string;
}

export interface UpdateProjectBody {
  name?: string;
  description?: string;
}

export interface ProjectApiKey {
  id: string;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
}

export interface ProjectApiKeyCreated {
  api_key: string;
  key_id: string;
  expires_at: string | null;
}

export interface ProjectApiKeysResponse {
  keys: ProjectApiKey[];
}

export interface UpdateProjectKeyParams {
  revoke?: boolean;
  expires_at?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  template_json: Record<string, unknown>;
  category: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplatesResponse {
  templates: Template[];
}

export interface ListTemplatesParams {
  category?: string;
  public_only?: boolean;
}

export interface CreateTemplateBody {
  name: string;
  description?: string;
  template_json: Record<string, unknown>;
  category?: string;
  is_public?: boolean;
  created_by?: string;
}

export interface UpdateTemplateBody {
  name?: string;
  description?: string;
  template_json?: Record<string, unknown>;
  category?: string;
  is_public?: boolean;
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

/** Backend origin without the `/api/v1` prefix (for `/exports/...` URLs). */
export function backendOrigin(): string {
  return API_BASE.replace(/\/api\/v1\/?$/, "");
}

/** Resolve a relative export path against the backend origin. */
export function resolveExportUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const origin = backendOrigin();
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

export function parseContentDispositionFilename(
  header: string | null,
): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  if (plain?.[1]) return plain[1].trim().replace(/^["']|["']$/g, "");
  return null;
}

export type ExportFormat = "pdf" | "epub" | "markdown" | "html";

export interface ExportUrlResponse {
  url: string;
}

export interface CompileResult {
  blob: Blob;
  filename: string | null;
}

async function requestBlob(path: string): Promise<CompileResult> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new ApiError(await readErrorMessage(res), res.status);
  }

  const blob = await res.blob();
  const filename = parseContentDispositionFilename(
    res.headers.get("Content-Disposition"),
  );
  return { blob, filename };
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  stats: () => request<StatsResponse>("/stats"),

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

  createBook: (body: CreateBookBody) =>
    request<BookResponse>("/books", { method: "POST", json: body }),

  generateOutline: (body: GenerateOutlineBody) =>
    request<BookResponse>("/generate-outline", { method: "POST", json: body }),

  generateChapter: (body: GenerateChapterBody) =>
    request<ChapterResponse>("/generate-chapter", {
      method: "POST",
      json: body,
    }),

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

  moderateChapter: (bookId: string, chapterId: string) =>
    request<ChapterResponse>(
      `/books/${bookId}/chapters/${chapterId}/moderate`,
      { method: "POST" },
    ),

  /** Authenticated manuscript text download (final review must be cleared). */
  compileBook: (id: string) => requestBlob(`/books/${id}/compile`),

  /** Authenticated export job; returns a relative `/exports/...` URL. */
  exportBook: (id: string, format: ExportFormat) =>
    request<ExportUrlResponse>(`/books/${id}/export/${format}`),

  listProjects: () => request<Project[]>("/projects/"),

  createProject: (body: CreateProjectBody) =>
    request<Project>("/projects/", { method: "POST", json: body }),

  getProject: (id: string) => request<Project>(`/projects/${id}`),

  updateProject: (id: string, body: UpdateProjectBody) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", json: body }),

  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),

  listProjectKeys: (projectId: string) =>
    request<ProjectApiKeysResponse>(`/projects/${projectId}/keys`),

  createProjectKey: (projectId: string) =>
    request<ProjectApiKeyCreated>(`/projects/${projectId}/keys`, {
      method: "POST",
    }),

  updateProjectKey: (
    projectId: string,
    keyId: string,
    params: UpdateProjectKeyParams,
  ) =>
    request<ProjectApiKey>(
      `/projects/${projectId}/keys/${keyId}${buildQuery(params)}`,
      { method: "PATCH" },
    ),

  deleteProjectKey: (projectId: string, keyId: string) =>
    request<void>(`/projects/${projectId}/keys/${keyId}`, {
      method: "DELETE",
    }),

  listTemplates: (params?: ListTemplatesParams) =>
    request<TemplatesResponse>(`/templates${buildQuery(params ?? {})}`),

  createTemplate: (body: CreateTemplateBody) =>
    request<Template>("/templates", { method: "POST", json: body }),

  getTemplate: (id: string) => request<Template>(`/templates/${id}`),

  updateTemplate: (id: string, body: UpdateTemplateBody) =>
    request<Template>(`/templates/${id}`, { method: "PATCH", json: body }),

  deleteTemplate: (id: string) =>
    request<void>(`/templates/${id}`, { method: "DELETE" }),
};
