import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  API_BASE,
  api,
  parseContentDispositionFilename,
  resolveExportUrl,
} from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

describe("resolveExportUrl", () => {
  it("resolves relative /exports paths against the backend origin, not /api/v1", () => {
    const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
    expect(resolveExportUrl("/exports/book.pdf")).toBe(
      `${origin}/exports/book.pdf`,
    );
  });

  it("passes through absolute URLs unchanged", () => {
    expect(resolveExportUrl("https://cdn.example/file.epub")).toBe(
      "https://cdn.example/file.epub",
    );
  });
});

describe("parseContentDispositionFilename", () => {
  it("parses quoted filename", () => {
    expect(
      parseContentDispositionFilename('attachment; filename="My Book.txt"'),
    ).toBe("My Book.txt");
  });

  it("parses RFC 5987 filename*", () => {
    expect(
      parseContentDispositionFilename(
        "attachment; filename*=UTF-8''My%20Book.txt",
      ),
    ).toBe("My Book.txt");
  });

  it("returns null when missing", () => {
    expect(parseContentDispositionFilename(null)).toBeNull();
    expect(parseContentDispositionFilename("inline")).toBeNull();
  });
});

describe("authenticated downloads", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("compileBook sends Bearer token and returns blob + filename", async () => {
    setToken("tok-compile");
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="Story.txt"',
      }),
      blob: async () => new Blob(["manuscript"], { type: "text/plain" }),
    } as Response);

    const result = await api.compileBook("book-1");

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/books/book-1/compile`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer tok-compile",
    );
    expect(result.filename).toBe("Story.txt");
    expect(await result.blob.text()).toBe("manuscript");
  });

  it("compileBook throws ApiError with status on failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "Final review required" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.compileBook("book-1")).rejects.toMatchObject({
      status: 409,
      message: "Final review required",
    });
    await expect(api.compileBook("book-1")).rejects.toBeInstanceOf(ApiError);
  });

  it("exportBook returns the relative url from the JSON body", async () => {
    setToken("tok-export");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: "/exports/book-1.pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await api.exportBook("book-1", "pdf");

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/books/book-1/export/pdf`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ url: "/exports/book-1.pdf" });
  });
});
