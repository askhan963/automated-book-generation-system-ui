import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage, authSchema } from "@/components/auth-page";

const navigate = vi.fn();
const login = vi.fn();
const register = vi.fn();
const logout = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    token: null,
    isLoading: false,
    login,
    register,
    logout,
  })),
}));

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
});
