import dynamic from "next/dynamic";
import { ProjectsSettingsLoading } from "@/components/projects/projects-settings-loading";

const ProjectsSettingsPage = dynamic(
  () =>
    import("@/components/projects/projects-settings-page").then((mod) => mod.ProjectsSettingsPage),
  {
    loading: () => <ProjectsSettingsLoading />,
  },
);

export default function ProjectsPage() {
  return <ProjectsSettingsPage />;
}
