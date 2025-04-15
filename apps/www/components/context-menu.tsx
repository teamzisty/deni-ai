import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { memo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ChatContextMenuProps {
  session: ChatSession;
  children: React.ReactNode;
}

export const ChatContextMenu = memo(({ session, children }: ChatContextMenuProps) => {
  const t = useTranslations("contextMenu");
  const [nameOpen, setNameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [chatName, setChatName] = useState(session.title);

  const { updateSession, deleteSession } = useChatSessions();

  const baseSession: ChatSession = {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    messages: session.messages,
  };

  useEffect(() => {
    setChatName(session.title);
  })

  const handleChatNameChange = () => {
    baseSession.title = chatName;
    updateSession(session.id, baseSession);
  };

  const handleDelete = () => {
    deleteSession(session.id);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={() => setNameOpen(true)}>
            {t("rename")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDeleteOpen(true)} className="text-red-500">
            {t("delete")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={nameOpen} onOpenChange={() => setNameOpen(!open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("renameTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("renameDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleChatNameChange}>
              {t("rename")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={() => setDeleteOpen(!deleteOpen)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild onClick={handleDelete}>
              <Button variant="destructive">{t("delete")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
})
ChatContextMenu.displayName = "ChatContextMenu";