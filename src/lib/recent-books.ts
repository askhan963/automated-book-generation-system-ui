export interface RecentBook {
  id: string;
  title: string;
  updated_at: string;
}

const LEGACY_KEY = "quill.recent-books";

function storageKey(userId: string): string {
  return `quill.recent-books:${userId}`;
}

export function getRecentBooks(
  userId: string | null | undefined,
): RecentBook[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberBook(
  userId: string,
  b: { id: string; title: string },
): void {
  if (typeof window === "undefined" || !userId) return;
  const list = getRecentBooks(userId).filter((x) => x.id !== b.id);
  list.unshift({
    id: b.id,
    title: b.title,
    updated_at: new Date().toISOString(),
  });
  localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, 10)));
}

/** Clear one user's recents, or the legacy unscoped key when no id is given. */
export function clearRecentBooks(userId?: string | null): void {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.removeItem(storageKey(userId));
    return;
  }
  localStorage.removeItem(LEGACY_KEY);
}
