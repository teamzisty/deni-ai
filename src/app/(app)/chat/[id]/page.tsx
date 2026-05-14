import type { UIMessage } from "ai";
import { safeValidateUIMessages } from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { db } from "@/db/drizzle";
import { chats, projects } from "@/db/schema";
import { auth } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const headersPromise = headers();
  const sessionPromise = headersPromise.then((headersList) =>
    auth.api.getSession({ headers: headersList }),
  );
  const [session, resolvedParams, resolvedSearch] = await Promise.all([
    sessionPromise,
    params,
    searchParams,
  ]);
  const userId = session?.session?.userId;

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const { id } = resolvedParams;

  // Single roundtrip: fetch the chat row and (if any) its project name via LEFT JOIN.
  let [row] = await db
    .select({
      chat: chats,
      projectName: projects.name,
    })
    .from(chats)
    .leftJoin(
      projects,
      and(eq(projects.id, chats.projectId), eq(projects.userId, userId)),
    )
    .where(and(eq(chats.id, id), eq(chats.uid, userId)));

  // Upsert path: client navigates to /chat/<uuid> immediately when starting a new
  // conversation. If the row doesn't exist yet and the id is a valid UUID, create
  // it inline — this saves the tRPC roundtrip the old flow used.
  if (!row) {
    if (!UUID_RE.test(id)) {
      redirect("/chat");
    }

    const projectIdFromQuery = resolvedSearch?.projectId ?? null;

    await db
      .insert(chats)
      .values({
        id,
        uid: userId,
        projectId: projectIdFromQuery,
        title: "New Chat",
      })
      .onConflictDoNothing();

    [row] = await db
      .select({
        chat: chats,
        projectName: projects.name,
      })
      .from(chats)
      .leftJoin(
        projects,
        and(eq(projects.id, chats.projectId), eq(projects.userId, userId)),
      )
      .where(and(eq(chats.id, id), eq(chats.uid, userId)));

    if (!row) {
      // ID belongs to another user, or insert failed — bail safely.
      redirect("/chat");
    }
  }

  const { chat, projectName } = row;

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: (chat.messages as UIMessage[]) ?? [],
  });
  const initialMessages = validatedMessages.success ? validatedMessages.data : [];

  return (
    <div className="-m-4 flex min-h-0 flex-1 overflow-hidden">
      <ChatInterface
        id={id}
        initialMessages={initialMessages}
        initialProjectId={chat.projectId}
        initialProjectName={projectName ?? null}
      />
    </div>
  );
}
