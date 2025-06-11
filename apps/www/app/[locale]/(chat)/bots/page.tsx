"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { Card, CardFooter, CardHeader } from "@workspace/ui/components/card";
import { MessageCircle, ArrowRight, Loader2, Verified } from "lucide-react";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/loading";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { SecureFetch } from "@/lib/secureFetch";
import { ClientBot } from "@/types/bot";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/ui/components/popover";

interface SharedChat {
  id: string;
  title: string;
  createdAt: string;
  viewCount: number;
  messageCount: number;
}

type CreateBotModalProps = {
  isOpen: boolean;
  user: User | null;
  setIsOpen: (isOpen: boolean) => void;
};

export default function PublicBotsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [publicBots, setPublicBots] = useState<ClientBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secureFetch = new SecureFetch(user);

  useEffect(() => {
    if (user) {
      secureFetch.updateUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (isLoading) return;

    const fetchPublicBots = async () => {
      try {
        setLoading(true);
        const response = await secureFetch.fetch("/api/bots/list");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("shared.error.fetchFailed"));
        }

        const data = await response.json();
        setPublicBots(data.data || []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : t("shared.error.unknown"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicBots();
  }, [isLoading]);

  if (loading || isLoading) {
    return <Loading />;
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          {" "}
          <h1 className="text-3xl font-bold">{t("bots.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("bots.subtitle")}</p>
        </div>
        {user && (
          <Button className="mt-4 md:mt-0" onClick={() => setIsModalOpen(true)}>
            {t("bots.createButton")}
          </Button>
        )}
      </div>

      {error ? (
        <div className="bg-destructive/10 p-4 rounded-lg mb-6">
          <p className="text-destructive">{error}</p>
        </div>
      ) : null}

      {publicBots.length === 0 && !error ? (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />{" "}
          <h2 className="text-xl font-semibold mb-2">
            {t("bots.empty.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("bots.empty.message")}
          </p>
          {user ? (
            <Button onClick={() => router.push("/chat/new")}>
              {t("shared.startChat")}
            </Button>
          ) : (
            <Button onClick={() => router.push("/login")}>
              {t("shared.login")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicBots.map((bot) => (
            <Card key={bot.id} className="mb-4 my-auto mx-auto w-full h-full">
              <CardHeader className="text-center">
                <h1 className="text-2xl font-bold">{bot.name}</h1>
                <div className="text-muted-foreground mt-2 flex items-center justify-center">
                  <span className="text-muted-foreground">
                    {t("bots.createdBy")}:{" "}
                  </span>
                  <div className="bg-primary text-primary-foreground rounded-full px-4 py-1 ml-2 flex items-center">
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() =>
                        toast.info(
                          t("bots.creatorIdToast", { id: bot.createdBy.id }),
                        )
                      }
                    >
                      {bot.createdBy.name}
                    </span>
                    {bot.createdBy.verified && (
                      <Popover>
                        <PopoverTrigger>
                          <Verified className="ml-1 h-4 w-4" />
                        </PopoverTrigger>
                        <PopoverContent className="flex items-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1 mr-2">
                            <Verified />
                          </div>
                          <div>
                            {" "}
                            <span className="text-sm">
                              {t("bots.verified.label")}
                            </span>
                            <br />
                            <span className="text-sm text-muted-foreground">
                              {t("bots.verified.disclaimer")}
                              {bot.createdBy.domain && (
                                <span>
                                  <br />
                                  {t("bots.verified.domain")}:{" "}
                                  {bot.createdBy.domain}
                                </span>
                              )}
                            </span>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
                <p>{bot.description}</p>
              </CardHeader>
              <CardFooter className="w-full mt-auto">
                <Button
                  variant="secondary"
                  className="rounded-full w-full h-full"
                  asChild
                >
                  <Link
                    href={`/bots/${bot.id}`}
                    className="flex items-center justify-center w-full h-full"
                  >
                    {" "}
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {t("bots.viewButton")}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateBotModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        user={user}
      />
    </main>
  );
}

function CreateBotModal({ isOpen, setIsOpen, user }: CreateBotModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secureFetch = new SecureFetch(user);

  useEffect(() => {
    if (user) {
      secureFetch.updateUser(user);
    }
  }, [user]);

  const handleCreateBot = async () => {
    try {
      setIsCreating(true);
      const response = await secureFetch.fetch("/api/bots/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: botName,
          description: botDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("bots.createModal.error"));
      }
      toast.success(t("bots.createModal.successMessage"));
      const data = await response.json();
      router.push(data.botUrl);

      setIsOpen(false);
      // Handle successful bot creation (e.g., redirect or show success message)
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : t("bots.createModal.error"),
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          {" "}
          <DialogTitle>{t("bots.createModal.title")}</DialogTitle>
          <DialogDescription>
            {t("bots.createModal.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {" "}
          <Label htmlFor="botName">{t("bots.createModal.nameLabel")}</Label>
          <Input
            id="botName"
            placeholder={t("bots.createModal.namePlaceholder")}
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
          />
          <Label htmlFor="botDescription" className="mt-4">
            {t("bots.createModal.descriptionLabel")}
          </Label>
          <Input
            id="botDescription"
            placeholder={t("bots.createModal.descriptionPlaceholder")}
            value={botDescription}
            onChange={(e) => setBotDescription(e.target.value)}
          />
          {error && (
            <div className="bg-destructive/10 p-4 rounded-lg mt-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          {" "}
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t("shared.cancel")}
          </Button>
          <Button
            type="submit"
            onClick={handleCreateBot}
            disabled={isCreating}
            className="ml-2"
          >
            {isCreating && <Loader2 className="animate-spin" />}
            {isCreating
              ? t("bots.createModal.creating")
              : t("bots.createModal.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
