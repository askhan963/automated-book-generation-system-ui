import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_BASE,
  api,
  type Project,
  type ProjectApiKey,
  type ProjectApiKeyCreated,
} from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth-storage";

const sampleProject: Project = {
  id: "proj-1",
  name: "Quill API",
  description: "Integration",
  owner_id: "user-1",
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

const sampleKey: ProjectApiKey = {
  id: "key-1",
  created_at: "2026-07-18T00:00:00Z",
  expires_at: null,
  revoked: false,
};

const createdKey: ProjectApiKeyCreated = {
  api_key: "secret-once",
  key_id: "key-1",
  expires_at: null,
};

describe("projects API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearToken();
    setToken("tok");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearToken();
  });

  it("lists and creates projects on trailing-slash collection routes", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify([sampleProject]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sampleProject), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(api.listProjects()).resolves.toEqual([sampleProject]);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/projects/`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );

    await api.createProject({ name: "Quill API", description: "Integration" });
    expect(fetch).toHaveBeenLastCalledWith(
      `${API_BASE}/projects/`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Quill API",
          description: "Integration",
        }),
      }),
    );
  });

  it("updates and deletes a project", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...sampleProject, name: "Renamed" }), {
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

    await api.updateProject("proj-1", { name: "Renamed" });
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/projects/proj-1`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Renamed" }),
      }),
    );

    await expect(api.deleteProject("proj-1")).resolves.toBeUndefined();
    expect(fetch).toHaveBeenLastCalledWith(
      `${API_BASE}/projects/proj-1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("creates, lists, revokes, and deletes API keys", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createdKey), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ keys: [sampleKey] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...sampleKey, revoked: true }), {
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

    await expect(api.createProjectKey("proj-1")).resolves.toEqual(createdKey);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/projects/proj-1/keys`,
      expect.objectContaining({ method: "POST" }),
    );

    await expect(api.listProjectKeys("proj-1")).resolves.toEqual({
      keys: [sampleKey],
    });

    await api.updateProjectKey("proj-1", "key-1", { revoke: true });
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/projects/proj-1/keys/key-1?revoke=true`,
      expect.objectContaining({ method: "PATCH" }),
    );

    await expect(
      api.deleteProjectKey("proj-1", "key-1"),
    ).resolves.toBeUndefined();
  });
});
