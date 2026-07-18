import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, KeyRound, Loader2, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — Quill" }] }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  return (
    <RequireAuth>
      <ProjectDetailContent />
    </RequireAuth>
  );
}

function ProjectDetailContent() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const projectQ = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });

  const keysQ = useQuery({
    queryKey: queryKeys.projectKeys(projectId),
    queryFn: () => api.listProjectKeys(projectId),
  });

  useEffect(() => {
    if (!projectQ.data) return;
    setName(projectQ.data.name);
    setDescription(projectQ.data.description ?? "");
  }, [projectQ.data]);

  const save = useMutation({
    mutationFn: () =>
      api.updateProject(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: (p) => {
      qc.setQueryData(queryKeys.project(projectId), p);
      void qc.invalidateQueries({ queryKey: queryKeys.projects });
      toast.success("Project saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteProject(projectId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects });
      toast.success("Project deleted");
      void navigate({ to: "/projects" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createKey = useMutation({
    mutationFn: () => api.createProjectKey(projectId),
    onSuccess: (created) => {
      setCreatedSecret(created.api_key);
      void qc.invalidateQueries({ queryKey: queryKeys.projectKeys(projectId) });
      toast.success("API key created — copy it now");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeKey = useMutation({
    mutationFn: (keyId: string) =>
      api.updateProjectKey(projectId, keyId, { revoke: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projectKeys(projectId) });
      toast.success("Key revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteKey = useMutation({
    mutationFn: (keyId: string) => api.deleteProjectKey(projectId, keyId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projectKeys(projectId) });
      toast.success("Key deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (projectQ.isLoading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening project…
      </main>
    );
  }

  if (projectQ.error || !projectQ.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-display text-4xl">Project not found</h1>
        <p className="mt-2 text-muted-foreground">
          {(projectQ.error as Error)?.message ??
            "We couldn't load this project."}
        </p>
        <Link
          to="/projects"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
      </main>
    );
  }

  const keys = keysQ.data?.keys ?? [];

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-16">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Projects
        </Link>
        <h1 className="mt-3 font-display text-5xl">{projectQ.data.name}</h1>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Details</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={remove.isPending}>
                <Trash2 />
                Delete project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the project and its API keys.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim()}
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">API keys</h2>
            <p className="text-sm text-muted-foreground">
              The raw secret is shown only once at creation.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={createKey.isPending}
            onClick={() => createKey.mutate()}
          >
            {createKey.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <KeyRound />
            )}
            Create key
          </Button>
        </div>

        {keysQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {key.id}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Created {new Date(key.created_at).toLocaleString()}
                    {key.revoked ? " · revoked" : ""}
                    {key.expires_at
                      ? ` · expires ${new Date(key.expires_at).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!key.revoked && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revokeKey.isPending}
                      onClick={() => revokeKey.mutate(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deleteKey.isPending}
                    onClick={() => deleteKey.mutate(key.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={Boolean(createdSecret)}
        onOpenChange={(open) => {
          if (!open) setCreatedSecret(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API key</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This secret will not be shown again.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={createdSecret ?? ""}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!createdSecret) return;
                void navigator.clipboard.writeText(createdSecret);
                toast.success("Copied");
              }}
            >
              <Copy />
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setCreatedSecret(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
