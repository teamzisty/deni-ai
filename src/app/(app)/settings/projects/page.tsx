import dynamic from "next/dynamic";

const ProjectsSettingsPage = dynamic(
  () =>
    import("@/components/projects/projects-settings-page").then((mod) => mod.ProjectsSettingsPage),
  {
    loading: () => <div className="py-10 text-sm text-muted-foreground">Loading projects…</div>,
  },
);

export default function ProjectsPage() {
  return <ProjectsSettingsPage />;
}
