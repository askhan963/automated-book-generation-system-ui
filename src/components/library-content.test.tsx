import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { LibraryContent } from "@/components/library-content";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode;
    to?: string;
    params?: Record<string, string>;
    className?: string;
  }) => <a {...props}>{children}</a>,
}));

const listBooks = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    listBooks: (...args: unknown[]) => listBooks(...args),
  },
}));

function renderLibrary() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LibraryContent />
    </QueryClientProvider>,
  );
}

describe("LibraryContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error state with retry instead of an empty shelf", async () => {
    listBooks.mockRejectedValue(new Error("Network down"));
    const user = userEvent.setup();
    renderLibrary();

    expect(
      await screen.findByText("Couldn't load your library"),
    ).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();
    expect(screen.queryByText("The shelf is empty")).not.toBeInTheDocument();

    listBooks.mockResolvedValueOnce([]);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("The shelf is empty")).toBeInTheDocument();
  });
});
