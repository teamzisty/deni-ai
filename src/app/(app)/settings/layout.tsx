import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsWrapper from "@/components/settings-wrapper";
import { auth } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.session) {
    redirect("/auth/sign-in");
  }

  if (session.user?.isAnonymous) {
    redirect("/app");
  }

  return <SettingsWrapper>{children}</SettingsWrapper>;
}
