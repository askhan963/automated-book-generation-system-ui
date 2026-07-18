import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, FileStack, Loader2, Plus } from "lucide-react";

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

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Quill" },
      {
        name: "description",
        content: "Browse and manage book outline templates.",
      },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  return (
    <RequireAuth>
      <TemplatesContent />
    </RequireAuth>
  );
}

function TemplatesContent() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("");
  const [publicOnly, setPublicOnly] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [templateJson, setTemplateJson] = useState('{\n  "chapters": []\n}');

  const filters = {
    category: category.trim() || undefined,
    public_only: publicOnly,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.templates(filters),
    queryFn: () => api.listTemplates(filters),
  });

  const templates = data?.templates ?? [];

  const create = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(templateJson) as Record<string, unknown>;
      } catch {
        throw new Error("Template JSON must be valid JSON.");
      }
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("Template JSON must be a JSON object.");
      }
      return api.createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        template_json: parsed,
        category: createCategory.trim() || undefined,
        is_public: isPublic,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created");
      setOpen(false);
      setName("");
      setDescription("");
      setCreateCategory("");
      setIsPublic(true);
      setTemplateJson('{\n  "chapters": []\n}');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <main className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates…
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-display text-5xl">Templates</h1>
        <p className="mt-4 text-muted-foreground">
          {error instanceof Error ? error.message : "Couldn't load templates."}
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
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Library
          </p>
          <h1 className="font-display text-5xl">Templates</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus />
              New template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create template</DialogTitle>
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
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Input
                  id="template-category"
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  placeholder="e.g. nonfiction"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="template-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="template-public">Public</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-json">Template JSON</Label>
                <Textarea
                  id="template-json"
                  value={templateJson}
                  onChange={(e) => setTemplateJson(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  required
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

      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="min-w-[12rem] flex-1 space-y-2">
          <Label htmlFor="filter-category">Category</Label>
          <Input
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="All categories"
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            id="filter-public"
            type="checkbox"
            checked={publicOnly}
            onChange={(e) => setPublicOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="filter-public">Public only</Label>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <FileStack className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-2xl">No templates found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust filters or create a template to get started.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {templates.map((t) => (
            <li key={t.id}>
              <Link
                to="/templates/$templateId"
                params={{ templateId: t.id }}
                className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="font-display text-2xl">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[t.category, t.is_public ? "Public" : "Private"]
                      .filter(Boolean)
                      .join(" · ")}
                    {t.description ? ` — ${t.description}` : ""}
                  </p>
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
