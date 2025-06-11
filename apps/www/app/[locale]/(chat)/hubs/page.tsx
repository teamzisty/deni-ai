"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useHubs } from "@/hooks/use-hubs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/navigation";
import { Plus, Folder } from "lucide-react";
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
import { Loading } from "@/components/loading";

export default function HubsPage() {
  const t = useTranslations();
  const { hubs, createHub, isLoading } = useHubs();
  const [isNewHubDialogOpen, setIsNewHubDialogOpen] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");

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
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("Hubs.title")}</h1>
        <Button onClick={() => setIsNewHubDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("Hubs.createNew")}
        </Button>
      </div>

      {hubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg">
          <Folder className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">{t("Hubs.noHubsYet")}</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            {t("Hubs.noHubsDescription")}
          </p>
          <Button onClick={() => setIsNewHubDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("Hubs.createNew")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.map((hub) => (
            <Card key={hub.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{hub.name}</CardTitle>
                <CardDescription>
                  {t("Hubs.chatSessionsCount", {
                    count: hub.chatSessionIds.length,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {hub.description || t("Hubs.noDescription")}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" asChild>
                  <Link href={`/hubs/${hub.id}`}>{t("common.view")}</Link>
                </Button>
                <span className="text-sm text-muted-foreground">
                  {new Date(hub.createdAt).toLocaleDateString()}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Hub Dialog */}
      <Dialog open={isNewHubDialogOpen} onOpenChange={setIsNewHubDialogOpen}>
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
                value={newHubName}
                onChange={(e) => setNewHubName(e.target.value)}
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
                value={newHubDescription}
                onChange={(e) => setNewHubDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewHubDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateHub}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
