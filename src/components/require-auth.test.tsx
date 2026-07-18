import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/use-auth";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("RequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while auth hydrates", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <RequireAuth>
        <p>Protected</p>
      </RequireAuth>,
    );
    expect(screen.getByText("Checking your session…")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("redirects logged-out users without mounting children", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <RequireAuth>
        <p>Protected</p>
      </RequireAuth>,
    );
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/login", replace: true }),
    );
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("renders children for an authenticated user", () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        email: "reader@example.com",
        role: "user",
        created_at: "2026-07-18T00:00:00Z",
        updated_at: "2026-07-18T00:00:00Z",
      },
      token: "token",
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <RequireAuth>
        <p>Protected</p>
      </RequireAuth>,
    );
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });
});
