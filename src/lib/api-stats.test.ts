import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE, api, type StatsResponse } from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

const sampleStats: StatsResponse = {
  total_books: 2,
  total_chapters: 5,
  books: [
    {
      book_id: "b1",
      title: "Lighthouse",
      chapters_count: 3,
      estimated_token_usage: 1200,
    },
  ],
  writing_style_analytics: {
    genre_distribution: { mystery: 1, literary: 1 },
    tone_distribution: { tense: 1 },
    audience_distribution: { adult: 2 },
    length_distribution: { novella: 1 },
  },
  token_consumption_trends: [
    { date: "2026-07-01", estimated_tokens: 400 },
    { date: "2026-07-02", estimated_tokens: 800 },
  ],
};

describe("api.stats", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
    setToken("tok");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("GETs /stats with the bearer token and returns the payload", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(sampleStats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await api.stats();

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/stats`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
    expect(result).toEqual(sampleStats);
  });
});
