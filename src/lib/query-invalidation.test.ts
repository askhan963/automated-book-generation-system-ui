import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { invalidateBookCaches } from "@/lib/query-invalidation";
import { queryKeys } from "@/lib/query-keys";

describe("invalidateBookCaches", () => {
  it("invalidates books, book, chapters, and draft for the id", async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");

    await invalidateBookCaches(client, "book-1");

    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.books });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.book("book-1") });
    expect(spy).toHaveBeenCalledWith({
      queryKey: queryKeys.chapters("book-1"),
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.draft("book-1") });
  });
});
