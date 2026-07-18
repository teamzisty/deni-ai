import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AppProviders } from "@/components/providers";
import { Spinner } from "@/components/ui/spinner";
import { getSession } from "@/lib/get-session";

/** Content-area only — AppShell (sidebar) stays visible while auth resolves. */
function AppContentFallback() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <Spinner className="size-5" />
    </div>
  );
}

async function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.session) {
    redirect("/auth/sign-in");
  }
  return children;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Shell first: sidebar paints with the static shell; only the main pane
  // suspends for session (and nested page data). Avoids a full-screen loader.
  return (
    <AppProviders>
      <AppShell>
        <Suspense fallback={<AppContentFallback />}>
          <RequireAuth>{children}</RequireAuth>
        </Suspense>
      </AppShell>
    </AppProviders>
  );
}
