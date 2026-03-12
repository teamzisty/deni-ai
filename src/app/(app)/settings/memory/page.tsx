"use client";

import { Brain, Plus, Save, Trash2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

type Tone = "concise" | "balanced" | "detailed";
type Friendliness = "neutral" | "friendly" | "very-friendly";
type Warmth = "neutral" | "warm" | "very-warm";
type EmojiStyle = "none" | "light" | "expressive";

type ProfileState = {
  instructions: string;
  tone: Tone;
  friendliness: Friendliness;
  warmth: Warmth;
  emojiStyle: EmojiStyle;
  autoMemory: boolean;
};

function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; description: string }>;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                selected ? "border-foreground bg-accent" : "border-border hover:bg-accent/50",
              )}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{option.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MemorySettingsPage() {
  const t = useExtracted();
  const utils = trpc.useUtils();
  const memoryQuery = trpc.memory.get.useQuery();
  const [profile, setProfile] = useState<ProfileState>({
    instructions: "",
    tone: "balanced",
    friendliness: "friendly",
    warmth: "warm",
    emojiStyle: "light",
    autoMemory: true,
  });
  const [instructionsDraft, setInstructionsDraft] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  useEffect(() => {
    if (!memoryQuery.data) {
      return;
    }

    setProfile({
      instructions: memoryQuery.data.profile.instructions,
      tone: memoryQuery.data.profile.tone as Tone,
      friendliness: memoryQuery.data.profile.friendliness as Friendliness,
      warmth: memoryQuery.data.profile.warmth as Warmth,
      emojiStyle: memoryQuery.data.profile.emojiStyle as EmojiStyle,
      autoMemory: memoryQuery.data.profile.autoMemory,
    });
    setInstructionsDraft(memoryQuery.data.profile.instructions);
  }, [memoryQuery.data]);

  const saveProfile = trpc.memory.upsertProfile.useMutation();

  const addItem = trpc.memory.addItem.useMutation({
    onSuccess: async () => {
      setNewMemory("");
      await utils.memory.get.invalidate();
      toast.success(t("Memory added."));
    },
    onError: (error) => {
      toast.error(error.message || t("Failed to add memory."));
    },
  });

  const deleteItem = trpc.memory.deleteItem.useMutation({
    onSuccess: async () => {
      await utils.memory.get.invalidate();
      toast.success(t("Memory removed."));
    },
    onError: (error) => {
      toast.error(error.message || t("Failed to remove memory."));
    },
  });

  const clearItems = trpc.memory.clearItems.useMutation({
    onSuccess: async () => {
      setIsClearDialogOpen(false);
      await utils.memory.get.invalidate();
      toast.success(t("All saved memories cleared."));
    },
    onError: (error) => {
      toast.error(error.message || t("Failed to clear memories."));
    },
  });

  const persistProfileInstant = (nextProfile: ProfileState) => {
    setProfile(nextProfile);
    saveProfile.mutate(
      {
        ...nextProfile,
        instructions: profile.instructions,
      },
      {
        onError: (error) => {
          toast.error(error.message || t("Failed to save personalization."));
        },
      },
    );
  };

  const handleSaveProfile = () => {
    const nextProfile = {
      ...profile,
      instructions: instructionsDraft,
    };

    saveProfile.mutate(nextProfile, {
      onSuccess: async () => {
        setProfile(nextProfile);
        await utils.memory.get.invalidate();
        toast.success(t("Personalization saved."));
      },
      onError: (error) => {
        toast.error(error.message || t("Failed to save personalization."));
      },
    });
  };

  const handleAddMemory = () => {
    if (!newMemory.trim()) {
      return;
    }

    addItem.mutate({ content: newMemory });
  };

  const handleClearMemories = () => {
    if (clearItems.isPending) {
      return;
    }

    clearItems.mutate();
  };

  const toneOptions = [
    {
      value: "concise" as Tone,
      label: t("Concise"),
      description: t("Short and direct replies"),
    },
    {
      value: "balanced" as Tone,
      label: t("Balanced"),
      description: t("A practical mix of brevity and detail"),
    },
    {
      value: "detailed" as Tone,
      label: t("Detailed"),
      description: t("More explanation and extra context"),
    },
  ];

  const friendlinessOptions = [
    {
      value: "neutral" as Friendliness,
      label: t("Neutral"),
      description: t("More matter-of-fact and restrained"),
    },
    {
      value: "friendly" as Friendliness,
      label: t("Friendly"),
      description: t("Approachable without being overly casual"),
    },
    {
      value: "very-friendly" as Friendliness,
      label: t("Very friendly"),
      description: t("More upbeat and personable"),
    },
  ];

  const warmthOptions = [
    {
      value: "neutral" as Warmth,
      label: t("Neutral"),
      description: t("Low emotional color"),
    },
    {
      value: "warm" as Warmth,
      label: t("Warm"),
      description: t("Supportive and human"),
    },
    {
      value: "very-warm" as Warmth,
      label: t("Very warm"),
      description: t("Extra empathetic and soft"),
    },
  ];

  const emojiOptions = [
    {
      value: "none" as EmojiStyle,
      label: t("None"),
      description: t("Never use emoji"),
    },
    {
      value: "light" as EmojiStyle,
      label: t("Light"),
      description: t("Use emoji occasionally"),
    },
    {
      value: "expressive" as EmojiStyle,
      label: t("Expressive"),
      description: t("Emoji are welcome"),
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{t("Personalize")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Control how Deni responds and what it remembers about you.")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Response Style")}</CardTitle>
          <CardDescription>
            {t("Shape the assistant's tone, warmth, friendliness, and emoji usage.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {memoryQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <OptionGroup
                label={t("Tone")}
                value={profile.tone}
                onChange={(tone) => {
                  if (tone === profile.tone) {
                    return;
                  }

                  persistProfileInstant({ ...profile, tone });
                }}
                options={toneOptions}
              />
              <OptionGroup
                label={t("Friendliness")}
                value={profile.friendliness}
                onChange={(friendliness) => {
                  if (friendliness === profile.friendliness) {
                    return;
                  }

                  persistProfileInstant({ ...profile, friendliness });
                }}
                options={friendlinessOptions}
              />
              <OptionGroup
                label={t("Warmth")}
                value={profile.warmth}
                onChange={(warmth) => {
                  if (warmth === profile.warmth) {
                    return;
                  }

                  persistProfileInstant({ ...profile, warmth });
                }}
                options={warmthOptions}
              />
              <OptionGroup
                label={t("Emoji")}
                value={profile.emojiStyle}
                onChange={(emojiStyle) => {
                  if (emojiStyle === profile.emojiStyle) {
                    return;
                  }

                  persistProfileInstant({ ...profile, emojiStyle });
                }}
                options={emojiOptions}
              />

              <div className="space-y-2">
                <div className="text-sm font-medium">{t("Instructions")}</div>
                <Textarea
                  value={instructionsDraft}
                  onChange={(event) => setInstructionsDraft(event.target.value)}
                  rows={7}
                  maxLength={4000}
                  placeholder={t(
                    "Reply in Japanese by default. Prefer practical implementation advice. When giving code suggestions, favor Next.js App Router and TypeScript strict mode.",
                  )}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{t("Auto-save memories")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("Let AI automatically save durable preferences or facts from your chats.")}
                  </div>
                </div>
                <Switch
                  checked={profile.autoMemory}
                  onCheckedChange={(autoMemory) =>
                    persistProfileInstant({ ...profile, autoMemory })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? <Spinner /> : <Save className="size-4" />}
                  {t("Save")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
            onClick={() => setIsClearDialogOpen(true)}
            disabled={
              !memoryQuery.data?.items.length || clearItems.isPending || memoryQuery.isLoading
            }
          >
            {clearItems.isPending ? <Spinner /> : <Trash2 className="size-4" />}
            {t("Clear all memories")}
          </Button>
          <div className="flex gap-2">
            <Input
              value={newMemory}
              onChange={(event) => setNewMemory(event.target.value)}
              placeholder={t("Add something Deni should remember about you")}
            />
            <Button onClick={handleAddMemory} disabled={addItem.isPending || !newMemory.trim()}>
              {addItem.isPending ? <Spinner /> : <Plus className="size-4" />}
              {t("Add")}
            </Button>
          </div>

          {memoryQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner />
            </div>
          ) : memoryQuery.data?.items.length ? (
            <ScrollArea className="max-h-[22rem]">
              <div className="space-y-2 pr-4">
                {memoryQuery.data.items.map((item) => (
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
                      onClick={() => deleteItem.mutate({ id: item.id })}
                      disabled={deleteItem.isPending || clearItems.isPending}
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

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Clear saved memories?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently remove every saved memory in Personalize. This action cannot be undone.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearItems.isPending}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={clearItems.isPending}
              onClick={handleClearMemories}
            >
              {clearItems.isPending ? <Spinner /> : null}
              {t("Clear all memories")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
