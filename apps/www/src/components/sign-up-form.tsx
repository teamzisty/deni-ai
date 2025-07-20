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
import { SiRefinedgithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { useTranslations } from "@/hooks/use-translations";
import { toast } from "sonner";
import { Provider } from "@supabase/supabase-js";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const tCommon = useTranslations("common");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError(t("auth.signUp.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : t("auth.signUp.errorOccurred"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithSocial = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (error) {
      console.error(error);
      toast.error(tCommon("error.title"));
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("auth.signUp.title")}</CardTitle>
          <CardDescription>{t("auth.signUp.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("auth.signUp.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.signUp.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("auth.signUp.password")}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">
                    {t("auth.signUp.repeatPassword")}
                  </Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t("auth.signUp.creatingAccount")
                  : t("auth.signUp.signUpButton")}
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-4 text-center text-sm text-muted-foreground">
              {t("auth.signUp.orSignUpWith")}{" "}
              <div className="flex justify-center gap-2 items-center w-full">
                <Button
                  onClick={() => signInWithSocial("github")}
                  type="button"
                  className="w-full"
                  variant="secondary"
                >
                  <SiRefinedgithub />
                  {t("auth.signUp.github")}
                </Button>

                <Button
                  onClick={() => signInWithSocial("google")}
                  type="button"
                  className="w-full"
                  variant="secondary"
                >
                  <SiGoogle />
                  {t("auth.signUp.google")}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              {t("auth.signUp.haveAccount")}{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                {t("auth.signUp.login")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
