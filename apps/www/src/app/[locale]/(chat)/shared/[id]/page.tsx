"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { UIMessage } from "ai";
import { Button } from "@workspace/ui/components/button";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import Messages from "@/components/chat/messages";

interface SharedChatData {
  title: string;
  messages: UIMessage[];
  createdAt: string;
  viewCount: number;
}

export default function SharedChatPage() {
  const t = useTranslations("shared");
  const params = useParams<{ id: string }>();
  const [chatData, setChatData] = useState<SharedChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/share?id=${params.id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("errors.notFound"));
        }

        const data = await response.json();
        setChatData(data.data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : t("errors.unknown"));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSharedChat();
    }
  }, [params.id]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success(t("copied"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">{t("errorOccurred")}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.history.back()}>{t("back")}</Button>
      </div>
    );
  }

  if (!chatData) {
    return null;
  }

  return (
    <main className="flex flex-col min-h-screen p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {chatData.title || t("newSession")}
          </h1>
          <p className="text-muted-foreground">
            {t("viewCount", { count: chatData.viewCount })} •{" "}
            {chatData.createdAt
              ? new Date(chatData.createdAt).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            {t("copyLink")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            {t("back")}
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg p-4 flex-grow">
        <Messages messages={chatData.messages} />
      </div>
    </main>
  );
}
