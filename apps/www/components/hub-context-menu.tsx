"use client";

import { Hub } from "@/types/hub";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useHubs } from "@/hooks/use-hubs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@workspace/ui/components/context-menu";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";

interface HubContextMenuProps {
  hub: Hub;
  children: React.ReactNode;
}

export function HubContextMenu({ hub, children }: HubContextMenuProps) {
  const t = useTranslations();
  const { getHub, updateHub, deleteHub } = useHubs();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(hub.name);
  const [editDescription, setEditDescription] = useState(hub.description || "");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const handleEditHub = () => {
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

    setEditDialogOpen(false);
    toast.success(t("Hubs.updated"));
  };

  const handleDeleteHub = () => {
    deleteHub(hub.id);
    setIsDeleteAlertOpen(false);
    toast.success(t("Hubs.deleted"));
  };

  const openEditDialog = () => {
    setEditName(hub.name);
    setEditDescription(hub.description || "");
    setEditDialogOpen(true);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("common.edit")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => setIsDeleteAlertOpen(true)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("common.delete")}
        </ContextMenuItem>
      </ContextMenuContent>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Hubs.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  );
}