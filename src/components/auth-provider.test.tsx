import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { clearToken, notifyUnauthorized, setToken } from "@/lib/auth-storage";

const me = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    me: () => me(),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

function AuthProbe() {
  const { token, user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? "null"}</span>
      <span data-testid="user">{user?.email ?? "null"}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const clearSpy = vi.spyOn(queryClient, "clear");
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { queryClient, clearSpy };
}

describe("AuthProvider unauthorized sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearToken();
  });

  afterEach(() => {
    clearToken();
  });

  it("clears in-memory token and query cache on unauthorized notification", async () => {
    setToken("stale-token");
    me.mockResolvedValue({
      id: "user-1",
      email: "reader@example.com",
      role: "user",
      created_at: "2026-07-18T00:00:00Z",
      updated_at: "2026-07-18T00:00:00Z",
    });

    const { clearSpy } = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("stale-token");
      expect(screen.getByTestId("user")).toHaveTextContent(
        "reader@example.com",
      );
    });

    notifyUnauthorized();

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("null");
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it("does not clear a valid session when /auth/me fails with a non-401 error", async () => {
    setToken("good-token");
    me.mockRejectedValue(new Error("Internal Server Error"));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("token")).toHaveTextContent("good-token");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });
});
