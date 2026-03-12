"use client";

import { FolderKanban, Globe, Grip, Link2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { Node } from "@xyflow/react";
import { Background, Controls } from "@xyflow/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Artifact,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { Canvas } from "@/components/ai-elements/canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/react";

const projectColors = ["amber", "rose", "sky", "emerald", "violet"] as const;
const artifactKinds = ["note", "brief", "checklist", "reference"] as const;

type ProjectColor = (typeof projectColors)[number];
type ArtifactKind = (typeof artifactKinds)[number];

type ProjectFormState = {
  name: string;
  description: string;
  instructions: string;
  color: ProjectColor;
};

type SourceFormState = {
  label: string;
  url: string;
  kind: "website" | "docs" | "repo";
};

type ArtifactFormState = {
  id: string | null;
  title: string;
  summary: string;
  body: string;
  kind: ArtifactKind;
  positionX: number;
  positionY: number;
};

const emptyProjectState: ProjectFormState = {
  name: "",
  description: "",
  instructions: "",
  color: "amber",
};

const emptySourceState: SourceFormState = {
  label: "",
  url: "",
  kind: "website",
};

const emptyArtifactState: ArtifactFormState = {
  id: null,
  title: "",
  summary: "",
  body: "",
  kind: "note",
  positionX: 80,
  positionY: 80,
};

const projectColorClass: Record<ProjectColor, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

export function ProjectsSettingsPage() {
  const t = useExtracted();
  const utils = trpc.useUtils();
  const projectsQuery = trpc.projects.list.useQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const projectDetailQuery = trpc.projects.get.useQuery(
    { id: selectedProjectId ?? "" },
    { enabled: Boolean(selectedProjectId) },
  );
  const [projectForm, setProjectForm] = useState<ProjectFormState>(emptyProjectState);
  const [sourceForm, setSourceForm] = useState<SourceFormState>(emptySourceState);
  const [artifactForm, setArtifactForm] = useState<ArtifactFormState>(emptyArtifactState);
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (projectsQuery.data?.length && !selectedProjectId) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    const project = projectDetailQuery.data?.project;
    if (!project) {
      setProjectForm(emptyProjectState);
      return;
    }

    setProjectForm({
      name: project.name,
      description: project.description ?? "",
      instructions: project.instructions,
      color: (project.color as ProjectColor) ?? "amber",
    });
  }, [projectDetailQuery.data?.project]);

  useEffect(() => {
    const artifacts = projectDetailQuery.data?.artifacts ?? [];
    setCanvasNodes(
      artifacts.map((artifact) => ({
        id: artifact.id,
        position: { x: artifact.positionX, y: artifact.positionY },
        data: {
          label: (
            <div className="space-y-1 rounded-xl border bg-background/95 p-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Grip className="size-3.5" />
                <span>{artifact.kind}</span>
              </div>
              <div className="font-medium text-sm">{artifact.title}</div>
              {artifact.summary ? (
                <div className="line-clamp-3 text-xs text-muted-foreground">{artifact.summary}</div>
              ) : null}
            </div>
          ),
        },
        draggable: true,
        selectable: true,
        style: { width: 240, border: "none", background: "transparent" },
      })),
    );
  }, [projectDetailQuery.data?.artifacts]);

  useEffect(() => {
    const selectedArtifact = projectDetailQuery.data?.artifacts.find(
      (artifact) => artifact.id === artifactForm.id,
    );

    if (!selectedArtifact && projectDetailQuery.data?.artifacts?.length) {
      const first = projectDetailQuery.data.artifacts[0];
      setArtifactForm({
        id: first.id,
        title: first.title,
        summary: first.summary ?? "",
        body:
          typeof first.content === "object" && first.content && "body" in first.content
            ? String(first.content.body)
            : "",
        kind: first.kind as ArtifactKind,
        positionX: first.positionX,
        positionY: first.positionY,
      });
    }

    if (!projectDetailQuery.data?.artifacts?.length) {
      setArtifactForm(emptyArtifactState);
    }
  }, [artifactForm.id, projectDetailQuery.data?.artifacts]);

  const createProject = trpc.projects.create.useMutation({
    onSuccess: async (project) => {
      await utils.projects.list.invalidate();
      setSelectedProjectId(project.id);
    },
  });
  const updateProject = trpc.projects.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.projects.list.invalidate(), utils.projects.get.invalidate()]);
    },
  });
  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.projects.list.invalidate(), utils.projects.get.invalidate()]);
      const nextProjects = await utils.projects.list.fetch();
      setSelectedProjectId(nextProjects[0]?.id ?? null);
    },
  });
  const createSource = trpc.projects.createSource.useMutation({
    onSuccess: async () => {
      setSourceForm(emptySourceState);
      await utils.projects.get.invalidate();
    },
  });
  const deleteSource = trpc.projects.deleteSource.useMutation({
    onSuccess: async () => {
      await utils.projects.get.invalidate();
    },
  });
  const createArtifact = trpc.projects.createArtifact.useMutation({
    onSuccess: async (artifact) => {
      await utils.projects.get.invalidate();
      setArtifactForm({
        id: artifact.id,
        title: artifact.title,
        summary: artifact.summary ?? "",
        body:
          typeof artifact.content === "object" && artifact.content && "body" in artifact.content
            ? String(artifact.content.body)
            : "",
        kind: artifact.kind as ArtifactKind,
        positionX: artifact.positionX,
        positionY: artifact.positionY,
      });
    },
  });
  const updateArtifact = trpc.projects.updateArtifact.useMutation({
    onSuccess: async () => {
      await utils.projects.get.invalidate();
    },
  });
  const deleteArtifact = trpc.projects.deleteArtifact.useMutation({
    onSuccess: async () => {
      await utils.projects.get.invalidate();
      setArtifactForm(emptyArtifactState);
    },
  });

  const activeProject = projectDetailQuery.data?.project ?? null;
  const activeArtifacts = projectDetailQuery.data?.artifacts ?? [];
  const activeSources = projectDetailQuery.data?.sources ?? [];

  const selectedArtifactRecord = useMemo(
    () => activeArtifacts.find((artifact) => artifact.id === artifactForm.id) ?? null,
    [activeArtifacts, artifactForm.id],
  );

  const handleCreateProject = async () => {
    await createProject.mutateAsync({
      name: t("New project"),
      description: null,
      instructions: "",
      color: "amber",
    });
  };

  const handleSaveProject = async () => {
    if (!selectedProjectId) {
      return;
    }

    await updateProject.mutateAsync({
      id: selectedProjectId,
      name: projectForm.name,
      description: projectForm.description || null,
      instructions: projectForm.instructions,
      color: projectForm.color,
    });
  };

  const handleCreateArtifact = async () => {
    if (!selectedProjectId) {
      return;
    }

    await createArtifact.mutateAsync({
      projectId: selectedProjectId,
      title: t("Untitled artifact"),
      summary: null,
      kind: "note",
      content: {
        body: "",
      },
      positionX: 80 + activeArtifacts.length * 24,
      positionY: 80 + activeArtifacts.length * 24,
    });
    setActiveTab("canvas");
  };

  const handleSaveArtifact = async () => {
    if (!selectedProjectId) {
      return;
    }

    if (artifactForm.id) {
      await updateArtifact.mutateAsync({
        id: artifactForm.id,
        projectId: selectedProjectId,
        title: artifactForm.title,
        summary: artifactForm.summary || null,
        kind: artifactForm.kind,
        content: {
          body: artifactForm.body,
        },
        positionX: artifactForm.positionX,
        positionY: artifactForm.positionY,
      });
      return;
    }

    await createArtifact.mutateAsync({
      projectId: selectedProjectId,
      title: artifactForm.title || t("Untitled artifact"),
      summary: artifactForm.summary || null,
      kind: artifactForm.kind,
      content: {
        body: artifactForm.body,
      },
      positionX: artifactForm.positionX,
      positionY: artifactForm.positionY,
    });
  };

  const isLoading =
    projectsQuery.isLoading || (Boolean(selectedProjectId) && projectDetailQuery.isLoading);

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="size-4" />
              {t("Projects")}
            </CardTitle>
            <CardDescription>
              {activeProject
                ? t(
                    "Projects power reusable chat context, canvas artifacts, and connected sources.",
                  )
                : t("Choose a project from the left column, or create a new one.")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeProject ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteProject.mutate({ id: activeProject.id })}
                disabled={deleteProject.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
            <Button onClick={handleCreateProject} disabled={createProject.isPending}>
              {createProject.isPending ? <Spinner /> : <Plus className="size-4" />}
              {t("New project")}
            </Button>
          </div>
        </div>

        {projectsQuery.data?.length ? (
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-xl border bg-muted/35 p-2">
              {projectsQuery.data.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`min-w-44 flex-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                    project.id === selectedProjectId
                      ? "border-primary bg-background text-foreground shadow-sm"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full ${projectColorClass[(project.color as ProjectColor) ?? "amber"] ?? "bg-amber-500"}`}
                    />
                    <span className="truncate font-medium text-sm">{project.name}</span>
                  </div>
                  {project.description ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">{t("Project workspace")}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {t("No projects yet. Create one to organize chats and reusable context.")}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Spinner />
          </div>
        ) : !activeProject ? null : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
              <TabsTrigger value="integrations">{t("Integrations")}</TabsTrigger>
              <TabsTrigger value="canvas">{t("Canvas")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">{t("Project name")}</Label>
                  <Input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(event) =>
                      setProjectForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-color">{t("Accent color")}</Label>
                  <Select
                    value={projectForm.color}
                    onValueChange={(value) =>
                      setProjectForm((current) => ({
                        ...current,
                        color: value as ProjectColor,
                      }))
                    }
                  >
                    <SelectTrigger id="project-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          <span className="flex items-center gap-2">
                            <span className={`size-2.5 rounded-full ${projectColorClass[color]}`} />
                            <span className="capitalize">{color}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">{t("Description")}</Label>
                <Textarea
                  id="project-description"
                  rows={3}
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder={t("What is this workspace for?")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-instructions">{t("Project instructions")}</Label>
                <Textarea
                  id="project-instructions"
                  rows={8}
                  value={projectForm.instructions}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "Explain the goals, constraints, audience, and preferred output format for this project.",
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProject} disabled={updateProject.isPending}>
                  {updateProject.isPending ? <Spinner /> : <Save className="size-4" />}
                  {t("Save project")}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4 pt-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <Link2 className="size-4" />
                  {t("Connected sources")}
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
                  <Input
                    value={sourceForm.label}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, label: event.target.value }))
                    }
                    placeholder={t("Label")}
                  />
                  <Input
                    value={sourceForm.url}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, url: event.target.value }))
                    }
                    placeholder="https://"
                  />
                  <Select
                    value={sourceForm.kind}
                    onValueChange={(value) =>
                      setSourceForm((current) => ({
                        ...current,
                        kind: value as SourceFormState["kind"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">{t("Website")}</SelectItem>
                      <SelectItem value="docs">{t("Docs")}</SelectItem>
                      <SelectItem value="repo">{t("Repo")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() =>
                      createSource.mutate({
                        projectId: activeProject.id,
                        label: sourceForm.label,
                        url: sourceForm.url,
                        kind: sourceForm.kind,
                      })
                    }
                    disabled={
                      createSource.isPending || !sourceForm.label.trim() || !sourceForm.url.trim()
                    }
                  >
                    {createSource.isPending ? <Spinner /> : <Plus className="size-4" />}
                    {t("Connect")}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {activeSources.length ? (
                  activeSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="size-4 text-muted-foreground" />
                          <span className="font-medium">{source.label}</span>
                          <Badge variant="outline">{source.kind}</Badge>
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {source.url}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSource.mutate({ id: source.id })}
                        disabled={deleteSource.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    {t(
                      "Add websites, docs, or repos here. The assistant can reuse them as connected project context.",
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="canvas" className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{t("Artifacts canvas")}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(
                      "Drag artifacts around the board and edit their content from the side panel.",
                    )}
                  </div>
                </div>
                <Button onClick={handleCreateArtifact} disabled={createArtifact.isPending}>
                  {createArtifact.isPending ? <Spinner /> : <Sparkles className="size-4" />}
                  {t("New artifact")}
                </Button>
              </div>

              <div className="space-y-4">
                {activeArtifacts.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activeArtifacts.map((artifact) => (
                      <button
                        key={artifact.id}
                        type="button"
                        onClick={() =>
                          setArtifactForm({
                            id: artifact.id,
                            title: artifact.title,
                            summary: artifact.summary ?? "",
                            body:
                              typeof artifact.content === "object" &&
                              artifact.content &&
                              "body" in artifact.content
                                ? String(artifact.content.body)
                                : "",
                            kind: artifact.kind as ArtifactKind,
                            positionX: artifact.positionX,
                            positionY: artifact.positionY,
                          })
                        }
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          artifact.id === artifactForm.id
                            ? "border-primary bg-primary/8 text-foreground"
                            : "border-border bg-background hover:bg-muted/50"
                        }`}
                      >
                        {artifact.title}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-2xl border bg-muted/20">
                  <div className="h-[72vh] min-h-[680px] max-h-[960px]">
                    <Canvas
                      nodes={canvasNodes}
                      edges={[]}
                      onNodeClick={(_, node) => {
                        const artifact = activeArtifacts.find((entry) => entry.id === node.id);
                        if (!artifact) {
                          return;
                        }
                        setArtifactForm({
                          id: artifact.id,
                          title: artifact.title,
                          summary: artifact.summary ?? "",
                          body:
                            typeof artifact.content === "object" &&
                            artifact.content &&
                            "body" in artifact.content
                              ? String(artifact.content.body)
                              : "",
                          kind: artifact.kind as ArtifactKind,
                          positionX: artifact.positionX,
                          positionY: artifact.positionY,
                        });
                      }}
                      onNodeDragStop={(_, node) => {
                        const artifact = activeArtifacts.find((entry) => entry.id === node.id);
                        if (!artifact) {
                          return;
                        }
                        setCanvasNodes((current) =>
                          current.map((entry) =>
                            entry.id === node.id ? { ...entry, position: node.position } : entry,
                          ),
                        );
                        updateArtifact.mutate({
                          id: artifact.id,
                          projectId: activeProject.id,
                          title: artifact.title,
                          summary: artifact.summary ?? null,
                          kind: artifact.kind as ArtifactKind,
                          content:
                            typeof artifact.content === "object" && artifact.content
                              ? {
                                  body: String(
                                    "body" in artifact.content ? artifact.content.body : "",
                                  ),
                                }
                              : { body: "" },
                          positionX: Math.round(node.position.x),
                          positionY: Math.round(node.position.y),
                        });
                        if (artifactForm.id === artifact.id) {
                          setArtifactForm((current) => ({
                            ...current,
                            positionX: Math.round(node.position.x),
                            positionY: Math.round(node.position.y),
                          }));
                        }
                      }}
                    >
                      <Controls />
                      <Background />
                    </Canvas>
                  </div>
                </div>

                <Artifact>
                  <ArtifactHeader>
                    <div>
                      <ArtifactTitle>
                        {selectedArtifactRecord?.title ?? t("Artifact editor")}
                      </ArtifactTitle>
                      <ArtifactDescription>
                        {selectedArtifactRecord
                          ? t(
                              "Selected artifact updates the shared project canvas and chat context.",
                            )
                          : t("Select or create an artifact to edit it here.")}
                      </ArtifactDescription>
                    </div>
                  </ArtifactHeader>
                  <ArtifactContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_220px_220px]">
                      <div className="space-y-2">
                        <Label htmlFor="artifact-title">{t("Title")}</Label>
                        <Input
                          id="artifact-title"
                          value={artifactForm.title}
                          onChange={(event) =>
                            setArtifactForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder={t("Artifact title")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artifact-kind">{t("Kind")}</Label>
                        <Select
                          value={artifactForm.kind}
                          onValueChange={(value) =>
                            setArtifactForm((current) => ({
                              ...current,
                              kind: value as ArtifactKind,
                            }))
                          }
                        >
                          <SelectTrigger id="artifact-kind">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {artifactKinds.map((kind) => (
                              <SelectItem key={kind} value={kind}>
                                <span className="capitalize">{kind}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artifact-summary">{t("Summary")}</Label>
                        <Input
                          id="artifact-summary"
                          value={artifactForm.summary}
                          onChange={(event) =>
                            setArtifactForm((current) => ({
                              ...current,
                              summary: event.target.value,
                            }))
                          }
                          placeholder={t("Short summary")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artifact-body">{t("Content")}</Label>
                      <Textarea
                        id="artifact-body"
                        rows={18}
                        value={artifactForm.body}
                        onChange={(event) =>
                          setArtifactForm((current) => ({ ...current, body: event.target.value }))
                        }
                        placeholder={t(
                          "Write notes, specs, checklists, or reusable project context here.",
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          artifactForm.id && deleteArtifact.mutate({ id: artifactForm.id })
                        }
                        disabled={!artifactForm.id || deleteArtifact.isPending}
                      >
                        {deleteArtifact.isPending ? <Spinner /> : <Trash2 className="size-4" />}
                        {t("Delete")}
                      </Button>
                      <Button
                        onClick={handleSaveArtifact}
                        disabled={updateArtifact.isPending || createArtifact.isPending}
                      >
                        {updateArtifact.isPending || createArtifact.isPending ? (
                          <Spinner />
                        ) : (
                          <Save className="size-4" />
                        )}
                        {artifactForm.id ? t("Save artifact") : t("Create artifact")}
                      </Button>
                    </div>
                  </ArtifactContent>
                </Artifact>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
