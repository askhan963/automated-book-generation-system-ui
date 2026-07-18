import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/require-auth";
import { LibraryContent } from "@/components/library-content";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Quill" },
      { name: "description", content: "Your in-progress manuscripts." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <RequireAuth>
      <LibraryContent />
    </RequireAuth>
  );
}
