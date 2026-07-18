/** Stable TanStack Query keys for server state. */
export const queryKeys = {
  authMe: ["auth", "me"] as const,
  health: ["health"] as const,
  stats: ["stats"] as const,
  books: ["books"] as const,
  book: (id: string) => ["book", id] as const,
  chapters: (id: string) => ["chapters", id] as const,
  draft: (id: string) => ["draft", id] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  projectKeys: (id: string) => ["project-keys", id] as const,
  templates: (filters?: { category?: string; public_only?: boolean }) =>
    ["templates", filters ?? {}] as const,
  template: (id: string) => ["template", id] as const,
};
