import { createFileRoute } from "@tanstack/react-router";

import { AuthPage } from "@/components/auth-page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Quill" },
      {
        name: "description",
        content: "Sign in to continue writing with Quill.",
      },
    ],
  }),
  component: () => <AuthPage mode="login" />,
});
