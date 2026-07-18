import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

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

export const Route = createFileRoute("/templates/$templateId")({
  head: () => ({ meta: [{ title: "Template — Quill" }] }),
  component: TemplateDetailPage,
});

function TemplateDetailPage() {
  return (
    <RequireAuth>
      <TemplateDetailContent />
    </RequireAuth>
  );
}

function TemplateDetailContent() {
  const { templateId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [templateJson, setTemplateJson] = useState("{}");

  const templateQ = useQuery({
    queryKey: queryKeys.template(templateId),
    queryFn: () => api.getTemplate(templateId),
  });

  useEffect(() => {
    if (!templateQ.data) return;
    setName(templateQ.data.name);
    setDescription(templateQ.data.description ?? "");
    setCategory(templateQ.data.category ?? "");
    setIsPublic(templateQ.data.is_public);
    setTemplateJson(JSON.stringify(templateQ.data.template_json, null, 2));
  }, [templateQ.data]);

  const save = useMutation({
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
      return api.updateTemplate(templateId, {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        is_public: isPublic,
        template_json: parsed,
      });
    },
    onSuccess: (t) => {
      qc.setQueryData(queryKeys.template(templateId), t);
      void qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteTemplate(templateId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted");
      void navigate({ to: "/templates" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (templateQ.isLoading) {
    return (
      <main className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-24 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening template…
      </main>
    );
  }

  if (templateQ.error || !templateQ.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-display text-4xl">Template not found</h1>
        <p className="mt-2 text-muted-foreground">
          {(templateQ.error as Error)?.message ??
            "We couldn't load this template."}
        </p>
        <Link
          to="/templates"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-16">
      <div>
        <Link
          to="/templates"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Templates
        </Link>
        <h1 className="mt-3 font-display text-5xl">{templateQ.data.name}</h1>
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
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="is-public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="is-public">Public</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-json">Template JSON</Label>
          <Textarea
            id="template-json"
            value={templateJson}
            onChange={(e) => setTemplateJson(e.target.value)}
            rows={12}
            className="font-mono text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.trim()}
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={remove.isPending}>
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. The template will be removed
                  permanently.
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
        </div>
      </section>
    </main>
  );
}
