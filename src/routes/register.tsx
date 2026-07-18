import { createFileRoute } from "@tanstack/react-router";

import { AuthPage } from "@/components/auth-page";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Quill" },
      {
        name: "description",
        content: "Create your Quill writing account.",
      },
    ],
  }),
  component: () => <AuthPage mode="register" />,
});
