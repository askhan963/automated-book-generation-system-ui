import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE, api, type Template } from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

const sampleTemplate: Template = {
  id: "tmpl-1",
  name: "Nonfiction outline",
  description: "Research-heavy chapters",
  template_json: { chapters: 8 },
  category: "nonfiction",
  is_public: true,
  created_by: "user-1",
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

describe("templates API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
    setToken("tok");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("lists templates with category and public_only query params", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ templates: [sampleTemplate] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      api.listTemplates({ category: "nonfiction", public_only: false }),
    ).resolves.toEqual({ templates: [sampleTemplate] });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/templates?category=nonfiction&public_only=false`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("lists templates without a query string when filters are omitted", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ templates: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.listTemplates();
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/templates`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("creates, gets, updates, and deletes templates", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sampleTemplate), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sampleTemplate), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...sampleTemplate, name: "Renamed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
        json: vi.fn(),
        text: async () => "",
        headers: new Headers(),
      } as unknown as Response);

    await api.createTemplate({
      name: "Nonfiction outline",
      template_json: { chapters: 8 },
      category: "nonfiction",
      is_public: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/templates`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Nonfiction outline",
          template_json: { chapters: 8 },
          category: "nonfiction",
          is_public: true,
        }),
      }),
    );

    await expect(api.getTemplate("tmpl-1")).resolves.toEqual(sampleTemplate);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/templates/tmpl-1`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );

    await api.updateTemplate("tmpl-1", { name: "Renamed" });
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/templates/tmpl-1`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Renamed" }),
      }),
    );

    await api.deleteTemplate("tmpl-1");
    expect(fetch).toHaveBeenLastCalledWith(
      `${API_BASE}/templates/tmpl-1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
