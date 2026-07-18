import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  api,
  buildQuery,
  request,
  shouldRetryQuery,
} from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://automated-book-generation-system-production.up.railway.app/api/v1";

describe("buildQuery", () => {
  it("omits undefined and null values and encodes the rest", () => {
    expect(
      buildQuery({
        category: "fiction",
        q: "hello world",
        skip: undefined,
        take: null,
        page: 2,
      }),
    ).toBe("?category=fiction&q=hello+world&page=2");
  });

  it("returns an empty string when there are no params", () => {
    expect(buildQuery({})).toBe("");
    expect(buildQuery({ a: undefined, b: null })).toBe("");
  });
});

describe("ApiError / request", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("attaches Authorization Bearer when a token is stored", async () => {
    setToken("tok-123");
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          message: "fine",
          supabase: { status: "ok", detail: null },
          openrouter: { status: "ok", detail: null },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await api.health();

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/health`,
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer tok-123",
    );
  });

  it("returns undefined for 204 No Content without calling json()", async () => {
    const json = vi.fn();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
      json,
      headers: new Headers(),
    } as unknown as Response);

    const result = await request<void>("/projects/x", { method: "DELETE" });

    expect(result).toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it("throws ApiError with HTTP status and flattened string detail", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "Not allowed" }), {
        status: 403,
        statusText: "Forbidden",
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.health()).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Not allowed",
    });
    await expect(api.health()).rejects.toBeInstanceOf(ApiError);
  });

  it("flattens validation detail arrays", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: [{ msg: "field required" }, { msg: "too short" }],
        }),
        {
          status: 422,
          statusText: "Unprocessable Entity",
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(api.health()).rejects.toMatchObject({
      status: 422,
      message: "field required, too short",
    });
  });

  it("clears the token and notifies on 401", async () => {
    setToken("expired");
    const notifySpy = vi.fn();
    window.addEventListener("quill:auth:unauthorized", notifySpy);

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.me()).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem("quill.access_token")).toBeNull();
    expect(notifySpy).toHaveBeenCalled();

    window.removeEventListener("quill:auth:unauthorized", notifySpy);
  });

  it("login throws ApiError with status on failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "bad credentials" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.login("a@b.com", "wrong")).rejects.toMatchObject({
      status: 401,
      message: "bad credentials",
    });
  });
});

describe("shouldRetryQuery", () => {
  it("does not retry ApiError 401", () => {
    expect(shouldRetryQuery(0, new ApiError("nope", 401))).toBe(false);
  });

  it("retries other errors up to the default limit", () => {
    expect(shouldRetryQuery(0, new ApiError("oops", 500))).toBe(true);
    expect(shouldRetryQuery(0, new Error("network"))).toBe(true);
    expect(shouldRetryQuery(3, new Error("network"))).toBe(false);
  });
});
