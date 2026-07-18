import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE, api, type BookResponse } from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

const sampleBook: BookResponse = {
  id: "book-1",
  title: "The Last Lighthouse",
  initial_notes: null,
  outline: null,
  outline_status: "outline_review",
  final_review_notes_status: "pending_notes",
  phase: "outline",
  human_notes: null,
  owner_id: "user-1",
  genre: "literary fiction",
  tone: "melancholy",
  audience: "adult",
  length: "novella",
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

describe("generateOutline style fields", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
    setToken("tok");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("posts optional genre, tone, audience, and length with the outline body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(sampleBook), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.generateOutline({
      title: "The Last Lighthouse",
      notes: "coastal setting",
      genre: "literary fiction",
      tone: "melancholy",
      audience: "adult",
      length: "novella",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/generate-outline`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "The Last Lighthouse",
          notes: "coastal setting",
          genre: "literary fiction",
          tone: "melancholy",
          audience: "adult",
          length: "novella",
        }),
      }),
    );
  });

  it("omits undefined style fields from the JSON body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ...sampleBook,
          genre: null,
          tone: null,
          audience: null,
          length: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await api.generateOutline({ title: "Untitled" });

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ title: "Untitled" });
  });
});
