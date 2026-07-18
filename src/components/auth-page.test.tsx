import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage, authSchema } from "@/components/auth-page";
import { useAuth } from "@/hooks/use-auth";

const navigate = vi.fn();
const login = vi.fn();
const register = vi.fn();
const logout = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}): void {
  mockedUseAuth.mockReturnValue({
    user: null,
    token: null,
    isLoading: false,
    login,
    register,
    logout,
    ...overrides,
  });
}

describe("authSchema", () => {
  it("rejects an invalid email and short password", () => {
    const result = authSchema.safeParse({
      email: "not-email",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth();
  });

  it("shows a loading state and hides the form while auth hydrates", () => {
    mockAuth({ isLoading: true });
    render(<AuthPage mode="login" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /checking your session/i,
    );
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it("logs in and navigates to the library", async () => {
    login.mockResolvedValue({ id: "user-1", email: "reader@example.com" });
    const user = userEvent.setup();
    render(<AuthPage mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "reader@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith("reader@example.com", "password123");
    expect(navigate).toHaveBeenCalledWith({ to: "/library" });
  });

  it("shows an error toast and stays put when login is rejected", async () => {
    login.mockRejectedValue(new Error("Invalid credentials"));
    const user = userEvent.setup();
    render(<AuthPage mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "reader@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("registers and navigates to the library", async () => {
    register.mockResolvedValue({ id: "user-1", email: "reader@example.com" });
    const user = userEvent.setup();
    render(<AuthPage mode="register" />);

    await user.type(screen.getByLabelText(/email/i), "reader@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(register).toHaveBeenCalledWith("reader@example.com", "password123");
    expect(navigate).toHaveBeenCalledWith({ to: "/library" });
  });

  it("shows signed-in UI and logs out to home", async () => {
    mockAuth({
      user: {
        id: "user-1",
        email: "reader@example.com",
        role: "user",
        created_at: "2026-07-18T00:00:00Z",
        updated_at: "2026-07-18T00:00:00Z",
      },
      token: "token",
    });
    const user = userEvent.setup();
    render(<AuthPage mode="login" />);

    expect(screen.getByText("Already signed in")).toBeInTheDocument();
    expect(screen.getByText("reader@example.com")).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({ to: "/" });
    expect(logout.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    );
  });
});
