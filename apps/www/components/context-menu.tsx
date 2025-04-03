import { ChatSession, useChatSessions } from "@/hooks/use-chat-sessions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@repo/ui/components/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { memo, useState } from "react";

interface ChatContextMenuProps {
  session: ChatSession;
  children: React.ReactNode;
}

export const ChatContextMenu = memo(({ session, children }: ChatContextMenuProps) => {
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
          {/* <ContextMenuItem onClick={onCopy}>
          コピー
        </ContextMenuItem>
        <ContextMenuSeparator /> */}
          <ContextMenuItem onClick={() => setNameOpen(true)}>
            名前を変更
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDeleteOpen(true)} className="text-red-500">
            削除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={nameOpen} onOpenChange={() => setNameOpen(!open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>名前の変更</AlertDialogTitle>
            <AlertDialogDescription>
              この会話の名前を変更します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleChatNameChange}>
              名前を変更
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
            <AlertDialogTitle>会話を削除する</AlertDialogTitle>
            <AlertDialogDescription>
              この会話を本当に削除しますか？チャットをエクスポートしない限り、この会話の内容は永久的に失われます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel >キャンセル</AlertDialogCancel>
            <AlertDialogAction asChild onClick={handleDelete}>
              <Button variant="destructive">削除</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
})
ChatContextMenu.displayName = "ChatContextMenu";