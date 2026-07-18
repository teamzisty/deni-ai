import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import GettingStartedPage from "@/components/getting-started-page";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Getting Started | Deni AI",
  description: "Set up your Deni AI workspace.",
};

function GettingStartedFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-5" />
    </div>
  );
}

async function GettingStartedContent() {
  await connection();
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) {
    redirect("/");
  }
  return <GettingStartedPage />;
}

export default function GettingStarted() {
  return (
    <Suspense fallback={<GettingStartedFallback />}>
      <GettingStartedContent />
    </Suspense>
  );
}
