import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_BASE,
  api,
  type BookResponse,
  type ChapterResponse,
} from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

const sampleBook: BookResponse = {
  id: "book-1",
  title: "Story",
  initial_notes: null,
  outline: null,
  outline_status: "outline_review",
  final_review_notes_status: "pending_notes",
  phase: "outline",
  human_notes: null,
  owner_id: "user-1",
  genre: "mystery",
  tone: "tense",
  audience: "adult",
  length: "novel",
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

const sampleChapter: ChapterResponse = {
  id: "ch-1",
  book_id: "book-1",
  chapter_number: 1,
  title: "Beginnings",
  content: "Once…",
  summary: null,
  status: "pending_review",
  human_notes: null,
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

describe("generation API coverage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
    setToken("tok");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("createBook posts title, notes, auto_approve, and style fields", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(sampleBook), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.createBook({
      title: "Story",
      initial_notes: "notes",
      auto_approve_outline: true,
      genre: "mystery",
      tone: "tense",
      audience: "adult",
      length: "novel",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/books`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "Story",
          initial_notes: "notes",
          auto_approve_outline: true,
          genre: "mystery",
          tone: "tense",
          audience: "adult",
          length: "novel",
        }),
      }),
    );
  });

  it("generateChapter posts chapter_id and optional style fields", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(sampleChapter), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.generateChapter({
      chapter_id: "ch-1",
      genre: "mystery",
      tone: "tense",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/generate-chapter`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chapter_id: "ch-1",
          genre: "mystery",
          tone: "tense",
        }),
      }),
    );
  });

  it("moderateChapter posts to the book-scoped moderate path", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...sampleChapter, status: "approved" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.moderateChapter("book-1", "ch-1");

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/books/book-1/chapters/ch-1/moderate`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});
