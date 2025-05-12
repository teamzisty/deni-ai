"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useHubs } from "@/hooks/use-hubs";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { Hub } from "@/types/hub";
import { ChatSession } from "@/hooks/use-chat-sessions";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { MessageCircleMore, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";
import { create } from "domain";

export default function HubDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { getHub, updateHub, removeChatFromHub, deleteHub } = useHubs();
  const { sessions, createSession, updateSession } = useChatSessions();
  const [hub, setHub] = useState<Hub | undefined>(undefined);
  const [hubSessions, setHubSessions] = useState<ChatSession[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const hubId = params?.id as string;

  // Load hub data
  useEffect(() => {
    if (!hubId) return;
    
    const fetchHub = () => {
      const foundHub = getHub(hubId);
      
      if (foundHub) {
        setHub(foundHub);
        // Find all chat sessions that belong to this hub
        const linkedSessions = sessions.filter(session => 
          foundHub.chatSessionIds.includes(session.id)
        );
        setHubSessions(linkedSessions);
      } else {
        // Handle case where hub is not found
        toast.error(t("Hubs.notFound"));
        router.push("/hubs");
      }
      
      setIsLoading(false);
    };
    
    fetchHub();
  }, [hubId, getHub, sessions, router, t]);

  const handleEditHub = () => {
    if (!hub) return;
    
    if (!editName.trim()) {
      toast.error(t("Hubs.nameRequired"));
      return;
    }

    const updatedHub = {
      ...hub,
      name: editName,
      description: editDescription || undefined
    };  

    updateHub(hub.id, updatedHub);
    
    // Update local state
    setHub({
      ...hub,
      name: editName,
      description: editDescription || undefined,
      updatedAt: Date.now()
    });
    
    setEditDialogOpen(false);
    toast.success(t("Hubs.updated"));
  };

  const openEditDialog = () => {
    if (!hub) return;
    setEditName(hub.name);
    setEditDescription(hub.description || "");
    setEditDialogOpen(true);
  };

  const handleDeleteHub = () => {
    if (!hub) return;
    
    deleteHub(hub.id);
    toast.success(t("Hubs.deleted"));
    router.push("/hubs");
  };

  const handleRemoveSession = (sessionId: string) => {
    if (!hub) return;
    
    removeChatFromHub(hub.id, sessionId);
    
    // Update local state
    setHub({
      ...hub,
      chatSessionIds: hub.chatSessionIds.filter(id => id !== sessionId),
      updatedAt: Date.now()
    });
    
    setHubSessions(hubSessions.filter(session => session.id !== sessionId));
    
    toast.success(t("Hubs.chatRemoved"));
  };

  const createNewChat = () => {
    // Create a new chat session
    const session = createSession();

    if (!session) {
      toast.error(t("common.error.occurred"));
      return;
    }

    // Add the new session to the hub
    if (hub) {
      const updatedHub = {
        ...hub,
        chatSessionIds: [...hub.chatSessionIds, session.id],
        updatedAt: Date.now()
      };
      
      updateHub(hub.id, updatedHub);
      
      // Update local state
      setHub(updatedHub);
      setHubSessions([...hubSessions, session]);

      updateSession(session.id, {
        ...session,
        hubId: hub.id
      });

      toast.success(t("common.success"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-lg">{t("common.loading")}</div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-500">{t("Hubs.notFound")}</div>
      </div>
    );
  }

  const formattedDate = new Date(hub.createdAt).toLocaleDateString();

  return (
    <div className="container max-w-5xl py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{hub.name}</h1>
          {hub.description && (
            <p className="text-muted-foreground mt-2">{hub.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {t("Hubs.createdOn", { date: formattedDate })}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={openEditDialog}>
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteHub} className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                {t("Hubs.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t("Hubs.linkedChats")}</CardTitle>
              <CardDescription>
                {t("Hubs.chatSessionsCount", { count: hubSessions.length })}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={createNewChat}>
              {t("Hubs.addNewChat")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hubSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("Hubs.noLinkedChats")}
            </div>
          ) : (
            <Table>
              <TableCaption>{t("Hubs.linkedChatsCaption")}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.title")}</TableHead>
                  <TableHead className="w-[200px]">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hubSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <Link href={`/chat/${session.id}`} className="hover:underline flex items-center gap-2">
                        <MessageCircleMore className="h-4 w-4" />
                        <span>{session.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveSession(session.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        {t("Hubs.remove")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Hubs.editTitle")}</DialogTitle>
            <DialogDescription>{t("Hubs.editDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-name" className="text-right">
                {t("Hubs.name")}
              </label>
              <Input
                id="edit-name"
                className="col-span-3"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-description" className="text-right">
                {t("Hubs.description")}
              </label>
              <Textarea
                id="edit-description"
                className="col-span-3"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditHub}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}