import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { authMeQueryKey } from "@/hooks/use-auth";

describe("queryKeys", () => {
  it("keeps authMe aligned with useAuth", () => {
    expect(queryKeys.authMe).toEqual(authMeQueryKey);
  });

  it("builds entity keys from ids", () => {
    expect(queryKeys.book("b1")).toEqual(["book", "b1"]);
    expect(queryKeys.chapters("b1")).toEqual(["chapters", "b1"]);
    expect(queryKeys.draft("b1")).toEqual(["draft", "b1"]);
    expect(queryKeys.books).toEqual(["books"]);
    expect(queryKeys.health).toEqual(["health"]);
    expect(queryKeys.stats).toEqual(["stats"]);
  });
});
