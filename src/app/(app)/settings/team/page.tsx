import dynamic from "next/dynamic";

const TeamSettingsPage = dynamic(
  () => import("@/components/team/team-settings-page").then((mod) => mod.TeamSettingsPage),
  {
    loading: () => (
      <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
        Loading team settings…
      </div>
    ),
  },
);

export default function TeamPage() {
  return <TeamSettingsPage />;
}
