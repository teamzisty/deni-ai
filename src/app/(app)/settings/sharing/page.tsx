"use client";

import { Check, Copy, ExternalLink, Globe, Link2, Lock, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/react";

function ShareItem({
  share,
  chat,
  recipients,
  onDelete,
  onUpdate,
}: {
  share: {
    id: string;
    chatId: string;
    visibility: "public" | "private";
    allowFork: boolean;
    createdAt: Date;
  };
  chat: { id: string; title: string | null };
  recipients: { id: string; name: string; email: string }[];
  onDelete: (chatId: string) => void;
  onUpdate: (chatId: string, visibility: "public" | "private", allowFork: boolean) => void;
}) {
  const t = useExtracted();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${share.id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t("Link copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleVisibility = () => {
    const newVisibility = share.visibility === "public" ? "private" : "public";
    onUpdate(share.chatId, newVisibility, share.allowFork);
  };

  const toggleFork = () => {
    onUpdate(share.chatId, share.visibility, !share.allowFork);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/chat/${chat.id}`} className="font-medium text-sm truncate hover:underline">
            {chat.title || t("Untitled")}
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={toggleVisibility} className="flex items-center">
                  <Badge
                    variant="secondary"
                    className={`shrink-0 cursor-pointer ${
                      share.visibility === "public"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {share.visibility === "public" ? (
                      <>
                        <Globe className="size-3 mr-1" />
                        {t("Public")}
                      </>
                    ) : (
                      <>
                        <Lock className="size-3 mr-1" />
                        {t("Private")}
                      </>
                    )}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {share.visibility === "public"
                  ? t("Click to switch to Private")
                  : t("Click to switch to Public")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={toggleFork} className="flex items-center">
                  <Badge
                    variant={share.allowFork ? "outline" : "secondary"}
                    className="shrink-0 cursor-pointer"
                  >
                    {share.allowFork ? t("Fork OK") : t("No Fork")}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {share.allowFork ? t("Click to disable forking") : t("Click to enable forking")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Link2 className="size-3" />
            {new Date(share.createdAt).toLocaleDateString()}
          </span>
          {share.visibility === "private" && recipients.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {t("{count, plural, one {# user} other {# users}}", {
                count: recipients.length,
              })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Copy link")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" asChild>
                <Link href={`/shared/${share.id}`} target="_blank">
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Open shared view")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(chat.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Revoke access")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default function SharingSettingsPage() {
  const t = useExtracted();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const myShares = trpc.share.getMyShares.useQuery();
  const sharedWithMe = trpc.share.getSharedWithMe.useQuery();

  const updateShare = trpc.share.createShare.useMutation({
    onSuccess: () => {
      utils.share.getMyShares.invalidate();
      toast.success(t("Settings updated"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteShare = trpc.share.deleteShare.useMutation({
    onSuccess: () => {
      utils.share.getMyShares.invalidate();
      toast.success(t("Share revoked"));
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdate = (chatId: string, visibility: "public" | "private", allowFork: boolean) => {
    updateShare.mutate({ chatId, visibility, allowFork });
  };

  const handleDelete = (chatId: string) => {
    setDeleteTarget(chatId);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteShare.mutate({ chatId: deleteTarget });
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{t("Sharing")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("Manage your shared conversations and access shared links from others.")}
        </p>
      </div>

      {/* My Shared Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("My Shared Links")}</CardTitle>
          <CardDescription>{t("Conversations you've shared with others.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {myShares.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-6 h-6" />
            </div>
          ) : myShares.data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-3">
                <Link2 className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">{t("No shared conversations yet.")}</p>
              <p className="text-xs mt-1">
                {t("Share a conversation from the chat menu to create a link.")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {myShares.data?.map((item) => (
                <ShareItem
                  key={item.share.id}
                  share={item.share}
                  chat={item.chat}
                  recipients={item.recipients}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared With Me */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t("Shared With Me")}</CardTitle>
          <CardDescription>{t("Conversations others have shared with you.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sharedWithMe.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-6 h-6" />
            </div>
          ) : sharedWithMe.data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-3">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">
                {t("No one has shared conversations with you yet.")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sharedWithMe.data?.map((item) => (
                <div
                  key={item.share.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {item.chat.title || t("Untitled")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {t("From: {name}", {
                          name: item.owner.name || t("Unknown"),
                        })}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" asChild>
                    <Link href={`/shared/${item.share.id}`}>
                      <ExternalLink className="size-4" />
                      {t("View")}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Revoke shared access?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will disable the share link. Anyone with the link will no longer be able to view this conversation.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteShare.isPending}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteShare.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteShare.isPending && <Spinner />}
              {t("Revoke Access")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
