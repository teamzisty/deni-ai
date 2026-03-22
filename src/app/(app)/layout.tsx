import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdSenseScript } from "@/components/adsense-script";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    redirect("/auth/sign-in");
  }
  return (
    <>
      <AdSenseScript />
      <AppShell>{children}</AppShell>
    </>
  );
}
