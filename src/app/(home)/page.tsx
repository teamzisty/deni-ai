import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { LoginButton } from "@/components/login-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useExtracted();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Alert className="w-full max-w-2xl border-amber-500/50 bg-amber-100/40 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
        <TriangleAlert className="mt-0.5 size-4" />
        <AlertTitle>{t("Message Migration")}</AlertTitle>
        <AlertDescription className="gap-3">
          <p>{t("Move your chats from the old version into this site.")}</p>
          <p>{t("Create a new account on this site to continue the migration.")}</p>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/migration">{t("Migration")}</Link>
          </Button>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col items-center text-center">
        <Badge className="mb-4 px-3 py-1 text-sm">{t("Welcome to Deni AI")}</Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
          {t.rich("AI Chatbot for <highlight>Everyone</highlight>", {
            highlight: (chunks) => (
              <span className="block decoration-primary decoration-4 bg-linear-to-r from-foreground/50 via-foreground/80 to-foreground bg-clip-text text-transparent tracking-tighter">
                {chunks}
              </span>
            ),
          })}
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl text-muted-foreground mb-6">
          {t(
            "Deni AI is an AI chat app created for everyone (those who can't afford to spend money). You can use the latest AI models for free.",
          )}
        </p>

        <LoginButton />
      </div>
    </main>
  );
}
