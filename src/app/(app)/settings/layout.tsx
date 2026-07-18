import { Suspense } from "react";
import { redirect } from "next/navigation";
import SettingsWrapper from "@/components/settings-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { getSession } from "@/lib/get-session";

function SettingsLayoutFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-5" />
    </div>
  );
}

async function AuthenticatedSettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.session) {
    redirect("/auth/sign-in");
  }

  if (session.user?.isAnonymous) {
    redirect("/chat");
  }

  return <SettingsWrapper>{children}</SettingsWrapper>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SettingsLayoutFallback />}>
      <AuthenticatedSettingsLayout>{children}</AuthenticatedSettingsLayout>
    </Suspense>
  );
}
