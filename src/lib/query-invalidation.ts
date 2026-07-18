import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

/** Invalidate every book-related cache entry after a book mutation. */
export async function invalidateBookCaches(
  queryClient: QueryClient,
  bookId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.books }),
    queryClient.invalidateQueries({ queryKey: queryKeys.book(bookId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.chapters(bookId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.draft(bookId) }),
  ]);
}
