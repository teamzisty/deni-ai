"use client";

import { cn } from "@workspace/ui/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { SiGoogle, SiRefinedgithub } from "@icons-pack/react-simple-icons";
import { useTranslations } from "@/hooks/use-translations";

export function LoginFormIntl({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth.login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/chat");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("loggingIn") : t("loginButton")}
              </Button>
            </div>
            {/* Provider login options */}
            <div className="mt-4 flex flex-col gap-4 text-center text-sm text-muted-foreground">
              {t("orLoginWith")}{" "}
              <div className="flex justify-center gap-2 items-center w-full">
                <Button
                  onClick={() =>
                    supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: "http://localhost:3000/chat" } })
                  }
                  type="button"
                  variant="outline"
                  className="w-full hover:border-gray-600 transition-colors duration-300 ease-in-out"
                >
                  <SiRefinedgithub className="mr-2 h-4 w-4" />
                  {t("github")}
                </Button>
                <Button
                  onClick={() =>
                    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "http://localhost:3000/chat" } })
                  }
                  type="button"
                  variant="outline"
                  className="w-full hover:border-blue-600 transition-colors duration-300 ease-in-out"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  {t("google")}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              {t("noAccount")}{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                {t("signUp")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
