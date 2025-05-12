"use client";

import { Hub } from "@/types/hub";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar";
import { Folder, FolderPlus, Loader2 } from "lucide-react";
import { useHubs } from "@/hooks/use-hubs";
import { Link } from "@/i18n/navigation";
import { HubContextMenu } from "./hub-context-menu";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";

export function HubSidebar() {
  const t = useTranslations();
  const { hubs, createHub, addChatToHub, isLoading } = useHubs();
  const [isNewHubDialogOpen, setIsNewHubDialogOpen] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");

  // Handle drag over events for hub items
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Change appearance to show it's a valid drop target
    e.currentTarget.classList.add("bg-accent/30");
  };

  // Reset styling when drag leaves
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-accent/30");
  };

  // Process drop operation
  const handleDrop = (e: React.DragEvent, hubId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-accent/30");

    try {
      // Try to parse the dragged data as JSON
      const dragData = e.dataTransfer.getData("application/json");

      if (dragData) {
        const { id: chatSessionId } = JSON.parse(dragData);

        if (chatSessionId) {
          // Add the chat to the hub
          addChatToHub(hubId, chatSessionId); // Updated function call
          toast.success(t("Hubs.chatAddedToHub"));
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  const handleCreateHub = () => {
    if (!newHubName.trim()) {
      toast.error(t("Hubs.nameRequired"));
      return;
    }

    createHub(newHubName, newHubDescription);
    setNewHubName("");
    setNewHubDescription("");
    setIsNewHubDialogOpen(false);
    toast.success(t("Hubs.created"));
  };
  

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          {t("Hubs.title")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hubs === undefined) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          {t("Hubs.title")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="flex flex-col gap-2 pl-2">
            <span className="text-muted-foreground">{t("Hubs.error")}</span>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Only render if there are hubs or to display the create hub option
  if (hubs.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          {t("Hubs.title")}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-2"
            onClick={() => setIsNewHubDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="flex flex-col gap-2 pl-2">
            <span className="text-muted-foreground">{t("Hubs.noHubsYet")}</span>
          </SidebarMenu>
        </SidebarGroupContent>

        <CreateHubDialog
          isOpen={isNewHubDialogOpen}
          onClose={() => setIsNewHubDialogOpen(false)}
          name={newHubName}
          setName={setNewHubName}
          description={newHubDescription}
          setDescription={setNewHubDescription}
          onSubmit={handleCreateHub}
        />
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {t("Hubs.title")}
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 ml-2"
          onClick={() => setIsNewHubDialogOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {hubs.map((hub) => (
            <SidebarMenuItem key={hub.id}>
              <HubContextMenu hub={hub}>
                <SidebarMenuButton
                  asChild
                  onDragOver={(e) => handleDragOver(e)}
                  onDragLeave={(e) => handleDragLeave(e)}
                  onDrop={(e) => handleDrop(e, hub.id)}
                  className="hub-item cursor-pointer"
                  data-hub-id={hub.id}
                >
                  <Link href={`/hubs/${hub.id}`} className="flex items-center">
                    <Folder className="h-4 w-4 mr-2" />
                    <span className="truncate">{hub.name}</span>
                    {hub.chatSessionIds.length > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {hub.chatSessionIds.length}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </HubContextMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>

      <CreateHubDialog
        isOpen={isNewHubDialogOpen}
        onClose={() => setIsNewHubDialogOpen(false)}
        name={newHubName}
        setName={setNewHubName}
        description={newHubDescription}
        setDescription={setNewHubDescription}
        onSubmit={handleCreateHub}
      />
    </SidebarGroup>
  );
}

type CreateHubDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  onSubmit: () => void;
};

function CreateHubDialog({
  isOpen,
  onClose,
  name,
  setName,
  description,
  setDescription,
  onSubmit,
}: CreateHubDialogProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Hubs.createNew")}</DialogTitle>
          <DialogDescription>{t("Hubs.createDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              {t("Hubs.name")}
            </label>
            <Input
              id="name"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              ref={inputRef}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right">
              {t("Hubs.description")}
            </label>
            <Textarea
              id="description"
              className="col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSubmit}>{t("common.create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
