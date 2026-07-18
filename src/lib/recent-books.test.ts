import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRecentBooks,
  getRecentBooks,
  rememberBook,
  type RecentBook,
} from "@/lib/recent-books";

describe("recent-books", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("scopes lists per user id", () => {
    rememberBook("user-a", { id: "1", title: "Alpha" });
    rememberBook("user-b", { id: "2", title: "Beta" });

    expect(getRecentBooks("user-a").map((b) => b.id)).toEqual(["1"]);
    expect(getRecentBooks("user-b").map((b) => b.id)).toEqual(["2"]);
  });

  it("returns an empty list without a user id", () => {
    rememberBook("user-a", { id: "1", title: "Alpha" });
    expect(getRecentBooks(null)).toEqual([]);
    expect(getRecentBooks(undefined)).toEqual([]);
  });

  it("does not read the legacy global key for scoped lookups", () => {
    const legacy: RecentBook[] = [
      { id: "legacy", title: "Leaked", updated_at: "2026-01-01T00:00:00Z" },
    ];
    localStorage.setItem("quill.recent-books", JSON.stringify(legacy));

    expect(getRecentBooks("user-a")).toEqual([]);
  });

  it("clears only the signed-in user's list on clearRecentBooks(userId)", () => {
    rememberBook("user-a", { id: "1", title: "Alpha" });
    rememberBook("user-b", { id: "2", title: "Beta" });

    clearRecentBooks("user-a");

    expect(getRecentBooks("user-a")).toEqual([]);
    expect(getRecentBooks("user-b").map((b) => b.id)).toEqual(["2"]);
  });

  it("moves a remembered book to the front and caps at 10", () => {
    for (let i = 0; i < 12; i++) {
      rememberBook("user-a", { id: String(i), title: `Book ${i}` });
    }
    rememberBook("user-a", { id: "3", title: "Book 3 again" });

    const list = getRecentBooks("user-a");
    expect(list).toHaveLength(10);
    expect(list[0]).toMatchObject({ id: "3", title: "Book 3 again" });
    expect(list.some((b) => b.id === "0")).toBe(false);
  });
});
