"use client";

import { Brain, Plus, Trash2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

type MemoryItem = {
  id: string;
  content: string;
  source: string;
};

type MemorySavedListCardProps = {
  status: "loading" | "error" | "ready";
  items: MemoryItem[];
  newMemory: string;
  onNewMemoryChange: (value: string) => void;
  onAddMemory: () => void;
  onDeleteItem: (id: string) => void;
  onClearClick: () => void;
  pending: {
    adding?: boolean;
    deleting?: boolean;
    clearing?: boolean;
  };
};

export function MemorySavedListCard({
  status,
  items,
  newMemory,
  onNewMemoryChange,
  onAddMemory,
  onDeleteItem,
  onClearClick,
  pending,
}: MemorySavedListCardProps) {
  const t = useExtracted();
  const isAdding = Boolean(pending.adding);
  const isDeleting = Boolean(pending.deleting);
  const isClearing = Boolean(pending.clearing);
  const isLoading = status === "loading";

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5 w-full">
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-4" />
            {t("Saved Memories")}
          </CardTitle>
          <CardDescription>
            {t(
              "These memories are reused across chats. AI can add them automatically, and you can add your own too.",
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full shrink-0 text-destructive hover:text-destructive"
          onClick={onClearClick}
          disabled={!items.length || isClearing || isLoading}
        >
          {isClearing ? <Spinner /> : <Trash2 className="size-4" />}
          {t("Clear all memories")}
        </Button>
        <div className="flex gap-2">
          <Input
            value={newMemory}
            onChange={(event) => onNewMemoryChange(event.target.value)}
            placeholder={t("Add something Deni should remember about you")}
          />
          <Button onClick={onAddMemory} disabled={isAdding || !newMemory.trim()}>
            {isAdding ? <Spinner /> : <Plus className="size-4" />}
            {t("Add")}
          </Button>
        </div>

        {status === "loading" ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : status === "error" ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            {t("Unable to load saved memories right now.")}
          </div>
        ) : items.length ? (
          <ScrollArea className="max-h-[22rem]">
            <div className="space-y-2 pr-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="break-words text-sm">{item.content}</div>
                    <Badge variant="outline">
                      {item.source === "auto" ? t("AI added") : t("You added")}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteItem(item.id)}
                    disabled={isDeleting || isClearing}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            {t("No saved memories yet. Add one manually or let AI learn from your chats.")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
