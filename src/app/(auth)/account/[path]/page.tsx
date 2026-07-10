import { ensureSession } from "@better-auth-ui/react/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Settings } from "@/components/auth/settings/settings";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";

/** Matches AuthProvider viewPaths.settings override (account → "settings"). */
const ACCOUNT_SETTINGS_PATHS = ["settings", "security"] as const;

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  if (!(ACCOUNT_SETTINGS_PATHS as readonly string[]).includes(path)) {
    notFound();
  }

  const requestHeaders = await headers();
  const queryClient = getQueryClient();

  const session = await ensureSession(queryClient, auth, {
    headers: requestHeaders,
  });

  if (!session) {
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent(`/account/${path}`)}`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="pt-24" id="main-content">
        <Header />
        <div className="mx-auto w-full max-w-3xl px-8 pb-12">
          <Settings path={path} />
        </div>
        <Footer />
      </main>
    </HydrationBoundary>
  );
}
