import SettingsWrapper from "@/components/settings-wrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SettingsWrapper>{children}</SettingsWrapper>;
}
