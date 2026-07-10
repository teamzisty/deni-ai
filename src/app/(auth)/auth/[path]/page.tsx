import { viewPaths } from "@better-auth-ui/core";
import { magicLinkPlugin } from "@better-auth-ui/core/plugins";
import { notFound } from "next/navigation";
import { Auth } from "@/components/auth/auth";
import { GuestSignInButton } from "@/components/guest-sign-in-button";

const magicLinkPaths = Object.values(magicLinkPlugin().viewPaths?.auth ?? {});

const validAuthPaths = new Set([...Object.values(viewPaths.auth), ...magicLinkPaths]);

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  if (!validAuthPaths.has(path)) {
    notFound();
  }

  const showGuest = path === viewPaths.auth.signIn;

  return (
    <main
      className="flex min-h-screen w-full grow flex-col items-center justify-center gap-4 p-4 md:p-6"
      id="main-content"
    >
      <Auth path={path} />
      {showGuest ? <GuestSignInButton className="w-full max-w-sm" size="sm" /> : null}
    </main>
  );
}
