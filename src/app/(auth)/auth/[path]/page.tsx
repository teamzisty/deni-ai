import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";
import { GuestSignInButton } from "@/components/guest-sign-in-button";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const showGuest = path === authViewPaths.SIGN_IN;

  return (
    <main className="h-full min-h-screen container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
      <AuthView
        path={path}
        callbackURL="/app"
        cardFooter={
          showGuest ? (
            <GuestSignInButton className="w-full" size="sm" />
          ) : undefined
        }
      />
    </main>
  );
}
