import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";

const navigate = vi.fn();
const logout = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigate,
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows login and register but hides library when logged out", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.queryByRole("link", { name: "Library" }),
    ).not.toBeInTheDocument();
  });

  it("shows library and the account email but hides auth links when logged in", () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        email: "reader.with.a.long.address@example.com",
        role: "user",
        created_at: "2026-07-18T00:00:00Z",
        updated_at: "2026-07-18T00:00:00Z",
      },
      token: "token",
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
      "href",
      "/library",
    );
    expect(
      screen.getByText("reader.with.a.long.address@example.com"),
    ).toHaveAttribute("title", "reader.with.a.long.address@example.com");
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Register" }),
    ).not.toBeInTheDocument();
  });

  it("logs out and navigates home", async () => {
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
      logout,
    });
    const user = userEvent.setup();

    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({ to: "/" });
    expect(logout.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    );
  });
});
