"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Save,
  Trash,
  PlusCircle,
  Copy,
  Loader2,
  Verified,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/loading";
import { ClientBot, Instruction } from "@/types/bot";
import { SecureFetch } from "@/lib/secureFetch";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@workspace/ui/components/alert-dialog";
import { Link, useRouter } from "@/i18n/navigation";

export default function BotEditorPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading, supabase } = useAuth();
  const [bot, setBot] = useState<ClientBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [instructions, setInstructions] = useState<Instruction[]>([]);

  const secureFetch = new SecureFetch(user);

  useEffect(() => {
    if (!user && !isLoading && supabase) {
      toast.error(t("shared.auth.loginRequired"));
      return;
    }

    if (user && !isLoading) {
      secureFetch.updateUser(user);
    }
  }, [user, isLoading, supabase]);

  useEffect(() => {
    if (isLoading) return;

    const fetchBotData = async () => {
      try {
        setLoading(true);

        // Custom fetch function to include auth token
        const response = await secureFetch.fetch(
          `/api/bots/retrieve?id=${params.id}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("bots.editor.fetchError"));
        }

        const data = await response.json();
        setBot(data.data);

        // Initialize form state with bot data
        setName(data.data.name);
        setDescription(data.data.description);
        setSystemInstruction(data.data.systemInstruction);
        setInstructions(data.data.instructions || []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : t("bots.editor.fetchError")
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBotData();
    }
  }, [params.id, t, isLoading, secureFetch, t]);

  const handleSave = async () => {
    if (!user) {
      toast.error(t("bots.editor.loginRequired"));
      return;
    }

    if (!name || !description || !systemInstruction) {
      toast.error(t("bots.editor.requiredFields"));
      return;
    }

    try {
      setIsSaving(true);

      const updatedBot = {
        id: params.id,
        name,
        description,
        systemInstruction,
        createdBy: {
          id: user.id,
          name: user.app_metadata.full_name,
          verified: user.email_confirmed_at ? true : false,
        },
        createdAt: bot?.createdAt,
        instructions,
      };

      const response = await secureFetch.fetch("/api/bots/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBot),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("bots.editor.updateError"));
      }

      toast.success(t("bots.editor.updateSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : t("bots.editor.updateError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInstruction = () => {
    if (instructions.length >= 4) {
      toast.error(t("bots.editor.maxInstructions"));
      return;
    }

    setInstructions([...instructions, { content: "" }]);
  };

  const handleUpdateInstruction = (index: number, content: string) => {
    const updatedInstructions = [...instructions];
    updatedInstructions[index] = { content };
    setInstructions(updatedInstructions);
  };

  const handleDeleteInstruction = (index: number) => {
    const updatedInstructions = instructions.filter((_, i) => i !== index);
    setInstructions(updatedInstructions);
  };

  const handleDeleteBot = async () => {
    if (!user) {
      toast.error(t("bots.editor.loginToDelete"));
      return;
    }

    try {
      const response = await secureFetch.fetch(
        `/api/bots/delete?id=${params.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("bots.editor.deleteError"));
      }

      toast.success(t("bots.editor.deleteSuccess"));
      router.push("/bots");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : t("bots.editor.deleteError")
      );
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/bots/${params.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("shared.clipboard.linkCopied"));
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">{t("shared.error.title")}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.history.back()}>
          {t("shared.back")}
        </Button>
      </div>
    );
  }

  if (!bot) {
    return null;
  }

  return (
    <main className="flex flex-col min-h-screen p-4 md:p-8 w-full">
      <Card className="w-full max-w-3xl mx-auto my-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {" "}
            <span className="text-lg">{t("bots.editor.title")}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
                <Copy className="h-4 w-4 mr-2" />
                {t("shared.shareLink")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4 mr-2" />
                {t("shared.delete")}
              </Button>
            </div>
          </CardTitle>{" "}
          <CardDescription>{t("bots.editor.description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            {" "}
            <Label htmlFor="name">{t("bots.editor.nameLabel")} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("bots.editor.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            {" "}
            <Label htmlFor="description">
              {t("bots.editor.descriptionLabel")} *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("bots.editor.descriptionPlaceholder")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            {" "}
            <Label htmlFor="systemInstruction">
              {t("bots.editor.systemInstructionLabel")} *
            </Label>
            <Textarea
              id="systemInstruction"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder={t("bots.editor.systemInstructionPlaceholder")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              {" "}
              <Label>{t("bots.editor.instructionsLabel")}</Label>
              <Button
                variant="outline"
                size="sm"
                disabled={instructions.length >= 4}
                onClick={handleAddInstruction}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("bots.editor.addInstruction")} ({instructions.length} / 4)
              </Button>
            </div>

            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={instruction.content}
                    onChange={(e) =>
                      handleUpdateInstruction(index, e.target.value)
                    }
                    placeholder={t("bots.editor.instructionPlaceholder")}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteInstruction(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {instructions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("bots.editor.noInstructions")}
                </p>
              )}
            </div>
          </div>

          {bot.createdBy && (
            <div className="pt-2 border-t">
              {" "}
              <p className="text-sm text-muted-foreground inline-flex items-center">
                {t("bots.createdBy")}: {bot.createdBy.name}
                {bot.createdBy.verified && (
                  <Verified className="ml-1 h-4 w-4 text-primary-foreground rounded-full" />
                )}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="grid grid-cols-1 md:grid-cols-2 items-center w-full mt-auto gap-2">
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                {" "}
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("shared.saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("shared.saveChanges")}
              </>
            )}
          </Button>
          <Button variant="secondary" className="w-full" asChild>
            <Link href={`/bots/${bot.id}`}>{t("shared.view")}</Link>
          </Button>
        </CardFooter>
      </Card>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {" "}
            <AlertDialogTitle>{t("shared.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bots.editor.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {" "}
            <AlertDialogCancel>{t("shared.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBot}
              className="bg-destructive"
            >
              {t("shared.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
