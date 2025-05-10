import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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
import { useHubs } from "@/hooks/use-hubs";
import { FolderPlus, Folder } from "lucide-react";

interface ChatContextMenuProps {
  session: ChatSession;
  children: React.ReactNode;
}

export const ChatContextMenu = memo(({ session, children }: ChatContextMenuProps) => {
  const t = useTranslations();
  const [nameOpen, setNameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [chatName, setChatName] = useState(session.title);

  const { updateSession, deleteSession } = useChatSessions();
  const { hubs, addChatToHub, removeChatFromHub } = useHubs();

  const baseSession: ChatSession = {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    messages: session.messages,
  };

  useEffect(() => {
    setChatName(session.title);
  }, [session.title]);

  const handleChatNameChange = () => {
    baseSession.title = chatName;
    updateSession(session.id, baseSession);
    setNameOpen(false);
  };

  const handleDelete = () => {
    deleteSession(session.id);
    setDeleteOpen(false);
  };

  // Find which hubs this conversation belongs to
  const chatHubs = hubs.filter(hub => 
    hub.chatSessionIds.includes(session.id)
  );

  const handleAddToHub = async (hubId: string) => {
    await addChatToHub(hubId, session.id);
  };

  const handleRemoveFromHub = async (hubId: string) => {
    await removeChatFromHub(hubId, session.id);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={() => setNameOpen(true)}>
            {t("contextMenu.rename")}
          </ContextMenuItem>
          
          {/* Hub Management Submenu */}
          {hubs.length > 0 && (
            <>
              <ContextMenuSeparator />
              
              {/* Add to Hub submenu */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  <span>{t("Hubs.addToHub")}</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {hubs.map(hub => {
                    const isInHub = hub.chatSessionIds.includes(session.id);
                    return (
                      <ContextMenuItem
                        key={hub.id}
                        onClick={() => handleAddToHub(hub.id)}
                        disabled={isInHub}
                        className={isInHub ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span className="truncate">{hub.name}</span>
                      </ContextMenuItem>
                    );
                  })}
                </ContextMenuSubContent>
              </ContextMenuSub>
              
              {/* Remove from Hub (only show if in at least one hub) */}
              {chatHubs.length > 0 && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <Folder className="mr-2 h-4 w-4" />
                    <span>{t("Hubs.removeFromHub")}</span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    {chatHubs.map(hub => (
                      <ContextMenuItem key={hub.id} onClick={() => handleRemoveFromHub(hub.id)}>
                        <Folder className="mr-2 h-4 w-4" />
                        <span className="truncate">{hub.name}</span>
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
            </>
          )}
          
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={nameOpen} onOpenChange={setNameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contextMenu.renameTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("contextMenu.renameDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("contextMenu.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleChatNameChange}>
              {t("contextMenu.rename")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contextMenu.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("contextMenu.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild onClick={handleDelete}>
              <Button variant="destructive">{t("common.delete")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
})
ChatContextMenu.displayName = "ChatContextMenu";