"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UIMessage } from "ai";
import { MessageLog } from "@/components/MessageLog";
import { Button } from "@repo/ui/components/button";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/loading";

interface SharedChatData {
  title: string;
  messages: UIMessage[];
  createdAt: string;
  viewCount: number;
}

export default function SharedChatPage() {
  const t = useTranslations();
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
          throw new Error(errorData.error || t("shared.error.notFound"));
        }
        
        const data = await response.json();
        console.log(data);
        setChatData(data.data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : t("shared.error.unknown"));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSharedChat();
    }
  }, [params.id, t]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success(t("shared.linkCopied"));
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
        <h1 className="text-2xl font-bold mb-4">{t("shared.error.title")}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.history.back()}>{t("shared.backButton")}</Button>
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
          <h1 className="text-2xl font-bold">{chatData.title || t("shared.untitledChat")}</h1>
          <p className="text-muted-foreground">
            {t("shared.viewCount", { count: chatData.viewCount })} • {
              chatData.createdAt
                ? new Date(chatData.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString()
            }
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            {t("shared.copyLink")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            {t("shared.backButton")}
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg p-4 flex-grow">
        {chatData.messages.map((message, index) => (
          <MessageLog key={index} message={message} sessionId={params.id as string} />
        ))}
      </div>
    </main>
  );
}