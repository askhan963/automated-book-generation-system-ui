import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, FolderKanban, Loader2, Plus } from "lucide-react";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Quill" },
      {
        name: "description",
        content: "Manage API projects and keys for Quill integrations.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <RequireAuth>
      <ProjectsContent />
    </RequireAuth>
  );
}

function ProjectsContent() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: api.listProjects,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects });
      toast.success("Project created");
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <main className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading projects…
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-display text-5xl">Projects</h1>
        <p className="mt-4 text-muted-foreground">
          {error instanceof Error ? error.message : "Couldn't load projects."}
        </p>
        <Button
          className="mt-6"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          Try again
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Integrations
          </p>
          <h1 className="font-display text-5xl">Projects</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus />
              New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                create.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={create.isPending || !name.trim()}
                >
                  {create.isPending && <Loader2 className="animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-2xl">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a project to issue API keys for external integrations.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="font-display text-2xl">{p.name}</p>
                  {p.description && (
                    <p className="text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
