"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card";

const Register: React.FC = () => {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { supabase, user, isLoading } = useAuth();
  const noticeRef = useRef<HTMLLabelElement | null>(null);
  const [accountEmail, setEmail] = useState("");
  const [accountPassword, setPassword] = useState("");

  useEffect(() => {
    if (!supabase && !isLoading) {
      toast.error(t("login.authError"), {
        description: t("login.authErrorDescription"),
      });
      router.push("/home");
    }

    if (user && !isLoading) {
      router.push("/home");
    }
  }, [user, isLoading, router, t, supabase]);

  const registerWithGoogle = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      if (noticeRef.current && error instanceof Error) {
        noticeRef.current.textContent = error.message;
      }
    }
  };

  const registerWithGitHub = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      if (noticeRef.current && error instanceof Error) {
        noticeRef.current.textContent = error.message;
      }
    }
  };

  const registerClicked = async () => {
    if (!supabase) return;

    if (!noticeRef.current) return;
    const notice = noticeRef.current;

    try {
      const { error } = await supabase.auth.signUp({
        email: accountEmail,
        password: accountPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) throw error;

      toast.success(t("register.checkEmail"), {
        description: t("register.confirmationSent"),
      });
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;

      if (error.message.includes("User already registered")) {
        notice.textContent = t("register.emailInUse");
      } else if (error.message.includes("Invalid email")) {
        notice.textContent = t("register.invalidEmail");
      } else if (error.message.includes("Password")) {
        notice.textContent = t("register.weakPassword");
      } else {
        notice.textContent = error.message;
      }
    }
  };

  return (
    <main className="overflow-y-auto max-h-screen">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("register.title")}</CardTitle>
            <CardDescription>{t("register.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("register.password")}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Label ref={noticeRef} className="text-red-500"></Label>
            <Button className="w-full" onClick={registerClicked}>
              {t("register.registerButton")}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 underline"
              >
                {t("register.signIn")}
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("login.continueWith")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={registerWithGoogle}
              >
                <SiGoogle className="mr-2 h-4 w-4" />
                {t("register.googleSignIn")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={registerWithGitHub}
              >
                <SiGithub className="mr-2 h-4 w-4" />
                {t("register.githubSignIn")}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {params.language === "ja" ? (
                <>
                  このサイトにログインすると、
                  <Link
                    href="/infomation/terms"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("register.terms")}
                  </Link>{" "}
                  と{" "}
                  <Link
                    href="/infomation/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("register.privacy")}
                  </Link>{" "}
                  に同意したことになります。
                </>
              ) : (
                <>
                  By logging in to this site, you agree to the{" "}
                  <Link
                    href="/infomation/terms"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("register.terms")}
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/infomation/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("register.privacy")}
                  </Link>
                  .
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Register;
