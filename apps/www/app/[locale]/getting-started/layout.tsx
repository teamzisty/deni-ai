import { Loading } from "@/components/loading";
import { Suspense } from "react";

import { cookies } from "next/headers";
import { ChatSessionsProvider } from "@/hooks/use-chat-sessions";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <ChatSessionsProvider>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </ChatSessionsProvider>
  );
}
