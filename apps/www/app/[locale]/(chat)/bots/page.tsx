"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/card";
import {
  MessageCircle,
  ArrowRight,
  Loader2,
  Verified,
} from "lucide-react";
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
import { User } from "firebase/auth";
import { SecureFetch } from "@/lib/secureFetch";
import { ClientBot } from "@/types/bot";
import { Popover, PopoverTrigger, PopoverContent } from "@workspace/ui/components/popover";

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
          err instanceof Error ? err.message : t("shared.error.unknown")
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
          <h1 className="text-3xl font-bold">Bots</h1>
          <p className="text-muted-foreground mt-2">
            Search or Create your bots. with Custom interactions.
          </p>
        </div>
        {user && (
          <Button className="mt-4 md:mt-0" onClick={() => setIsModalOpen(true)}>
            Create Bots
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
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No bots in there</h2>
          <p className="text-muted-foreground mb-6">
            You are first! Create a bot to get started.
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
            <Card
              key={bot.id}
              className="mb-4 my-auto mx-auto w-full h-full"
            >
              <CardHeader className="text-center">
                <h1 className="text-2xl font-bold">{bot.name}</h1>
                <div className="text-muted-foreground mt-2 flex items-center justify-center">
                  <span className="text-muted-foreground">Created by: </span>
                  <div className="bg-primary text-primary-foreground rounded-full px-4 py-1 ml-2 flex items-center">
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() =>
                        toast.info(`Creator ID: ${bot.createdBy.id}`)
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
                            <span className="text-sm">
                              This user is email verified.
                            </span>

                            <br />

                            <span className="text-sm text-muted-foreground">
                              This badge does not guarantee the quality of this
                              Bot.
                              {bot.createdBy.domain && (
                                <span>
                                  <br />
                                  Domain: {bot.createdBy.domain}
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
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View
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
        throw new Error(errorData.error || "Failed to create bot");
      }

      toast.success("Bot created successfully!");
      const data = await response.json();
      router.push(data.botUrl);

      setIsOpen(false);
      // Handle successful bot creation (e.g., redirect or show success message)
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to create bot");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new bot</DialogTitle>
          <DialogDescription>
            Fill in the details below to create your bot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="botName">Bot Name</Label>
          <Input
            id="botName"
            placeholder="Enter bot name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
          />

          <Label htmlFor="botDescription" className="mt-4">
            Bot Description
          </Label>
          <Input
            id="botDescription"
            placeholder="Enter bot description"
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleCreateBot}
            disabled={isCreating}
            className="ml-2"
          >
            {isCreating && <Loader2 className="animate-spin" />}
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
