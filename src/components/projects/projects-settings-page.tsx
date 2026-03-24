"use client";

import { FolderKanban, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useExtracted } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsPageShell } from "@/components/settings-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/react";

const projectColorClass: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

export function ProjectsSettingsPage() {
  const t = useExtracted();
  const router = useRouter();
  const utils = trpc.useUtils();
  const projectsQuery = trpc.projects.list.useQuery();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: async (project) => {
      await utils.projects.list.invalidate();
      if (project?.id) {
        router.push(`/projects/${project.id}`);
      }
    },
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: async () => {
      await utils.projects.list.invalidate();
    },
  });

  const handleCreateProject = () => {
    createProject.mutate({
      name: t("New project"),
      description: null,
      instructions: "",
      color: "amber",
    });
  };

  return (
    <SettingsPageShell title={t("Projects")}>
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="size-4" />
                {t("Projects")}
              </CardTitle>
              <CardDescription>
                {t("Organize chats with custom instructions and knowledge files.")}
              </CardDescription>
            </div>
            <Button onClick={handleCreateProject} disabled={createProject.isPending}>
              {createProject.isPending ? <Spinner /> : <Plus className="size-4" />}
              {t("New project")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projectsQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : !projectsQuery.data?.length ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("No projects yet. Create one to organize chats with custom context.")}
            </div>
          ) : (
            <div className="space-y-2">
              {projectsQuery.data.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${projectColorClass[project.color] ?? "bg-amber-500"}`}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sm">{project.name}</div>
                      {project.description ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {project.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>
                        <ExternalLink className="size-3.5" />
                        {t("Open")}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={t("Delete project")}
                      onClick={() => {
                        if (!window.confirm(t("Delete this project?"))) return;
                        deleteProject.mutate({ id: project.id });
                      }}
                      disabled={deleteProject.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SettingsPageShell>
  );
}
