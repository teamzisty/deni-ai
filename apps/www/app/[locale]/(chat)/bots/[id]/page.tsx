"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UIMessage } from "ai";
import { MessageLog } from "@/components/MessageLog";
import { Button } from "@workspace/ui/components/button";
import { Share2, Copy, Verified, MessageCircleMore, Edit } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/loading";
import { Bot, ClientBot } from "@/types/bot";
import { SecureFetch } from "@/lib/secureFetch";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { Link, useRouter } from "@/i18n/navigation";

export default function BotsDetailsPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { auth, user, isLoading } = useAuth();
  const [chatData, setChatData] = useState<ClientBot | null>(null);
  const [loading, setLoading] = useState(true);
  const { createSession } = useChatSessions();
  const [error, setError] = useState<string | null>(null);

  const secureFetch = new SecureFetch(user);

  useEffect(() => {
    if (!user && !isLoading && auth) {
      toast.error("You need to be logged in to view this page.");
      return;
    }

    if (user && !isLoading) {
      secureFetch.updateUser(user);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const fetchSharedChat = async () => {
      try {
        setLoading(true);

        // Custom fetch function to include auth token
        const response = await secureFetch.fetch(
          `/api/bots/retrieve?id=${params.id}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch shared chat data"
          );
        }

        const data = await response.json();
        setChatData(data.data);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch shared chat data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSharedChat();
    }
  }, [params.id, t, isLoading]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Loading />
      </div>
    );
  }

  const handleCreateSession = async () => {
    if (!user) {
      toast.error("You need to be logged in to create a session.");
      return;
    }

    if (!chatData) {
      toast.error("Chat data is not available.");
      return;
    }

    try {
      const session = createSession(chatData);
      if (session) {
        toast.success("Session created successfully!");
        router.push(`/chat/${session.id}`);
      } else {
        toast.error("Failed to create session.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create session.");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full p-4">
        <h1 className="text-2xl font-bold mb-4">{t("shared.error.title")}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.history.back()}>Back</Button>
      </div>
    );
  }

  if (!chatData) {
    return null;
  }

  return (
    <main className="flex flex-col min-h-screen p-4 md:p-8 w-full">
      <Card className="mb-4 my-auto mx-auto w-full h-full max-w-2xl md:max-h-1/2">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold">{chatData.name}</h1>
          <div className="text-muted-foreground mt-2 flex items-center justify-center">
            <span className="text-muted-foreground">Created by: </span>
            <div className="bg-primary text-primary-foreground rounded-full px-4 py-1 ml-2 flex items-center">
              <span
                className="cursor-pointer hover:underline"
                onClick={() =>
                  toast.info(`Creator ID: ${chatData.createdBy.id}`)
                }
              >
                {chatData.createdBy.name}
              </span>
              {chatData.createdBy.verified && (
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
                        This badge does not guarantee the quality of this Bot.
                        {chatData.createdBy.domain && (
                          <span>
                            <br />
                            Domain: {chatData.createdBy.domain}
                          </span>
                        )}
                      </span>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          <p>{chatData.description}</p>
        </CardHeader>
        {chatData.instructions && (
          <div className="w-full max-w-2xl">
            <h2 className="text-lg font-semibold text-center mb-2">Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-center w-full max-w-2xl">
              {chatData.instructions?.map((instruction, index) => (
                <div
                  key={index}
                  className="mb-4 bg-secondary rounded-lg p-2 mx-4 text-center"
                >
                  <span className="font-semibold">{instruction.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <CardFooter className="grid grid-cols-1 md:grid-cols-2 items-center w-full mt-auto gap-2">
          <Button
            variant="secondary"
            className="rounded-full w-full h-full"
            onClick={handleCopyLink}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          {chatData.createdBy.id == user?.uid ? (
            <Button
              className="rounded-full w-full h-full"
              variant="secondary"
              asChild
            >
              <Link
                href={`/bots/editor/${chatData.id}`}
                className="flex items-center justify-center w-full h-full"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          ) : null}
          <Button
            className={`rounded-full w-full h-full
    ${chatData.createdBy.id == user?.uid ? "md:col-span-2" : ""}
  `}
            onClick={handleCreateSession}
          >
            <MessageCircleMore className="mr-2 h-4 w-4" />
            Use this Bot
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
