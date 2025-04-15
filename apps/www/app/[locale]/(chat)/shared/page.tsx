"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { MessageCircle, Eye, Calendar, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Loading } from "@/components/loading";
import { useAuth } from "@/context/AuthContext";

interface SharedChat {
  id: string;
  title: string;
  createdAt: string;
  viewCount: number;
  messageCount: number;
}

export default function SharedChatsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sharedChats, setSharedChats] = useState<SharedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedChats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/share/list");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("shared.error.fetchFailed"));
        }
        
        const data = await response.json();
        setSharedChats(data.chats || []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : t("shared.error.unknown"));
      } finally {
        setLoading(false);
      }
    };

    fetchSharedChats();
  }, [t]);

  if (loading || isLoading) {
    return (
      <Loading />
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("shared.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("shared.description")}</p>
        </div>
        {user && (
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => router.push("/home")}
          >
            {t("shared.myChats")}
          </Button>
        )}
      </div>

      {error ? (
        <div className="bg-destructive/10 p-4 rounded-lg mb-6">
          <p className="text-destructive">{error}</p>
        </div>
      ) : null}

      {sharedChats.length === 0 && !error ? (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("shared.noChats")}</h2>
          <p className="text-muted-foreground mb-6">{t("shared.noChatsDescription")}</p>
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
          {sharedChats.map((chat) => (
            <Card key={chat.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{chat.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{chat.messageCount} {t("shared.messages")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{chat.viewCount} {t("shared.views")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push(`/shared/${chat.id}`)}
                >
                  {t("shared.view")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}