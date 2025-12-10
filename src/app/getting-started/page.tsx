import { headers } from "next/headers";
import { redirect } from "next/navigation";
import GettingStartedPage from "@/components/getting-started-page";
import { auth } from "@/lib/auth";

export default async function GettingStarted() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) {
    redirect("/");
  }
  return <GettingStartedPage />;
}
