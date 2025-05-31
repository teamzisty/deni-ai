"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@workspace/ui/components/card";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

const Login: React.FC = () => {
  const t = useTranslations();
  const noticeRef = useRef<HTMLLabelElement | null>(null);
  const { user, isLoading, supabase } = useAuth();
  const params = useParams();
  const router = useRouter();

  const [accountEmail, setEmail] = useState("");
  const [accountPassword, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");

  useEffect(() => {
    if (!supabase && !isLoading) {
      toast.error(t("common.error.occurred"), {
        description: t("account.authDisabled"),
      });
      router.push("/home");
    }

    if (user && !isLoading) {
      router.push("/home");
    }
  }, [user, isLoading, router, t, supabase]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setTwoFaCode("");
  };

  const signInWithGoogle = async () => {
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

  const signInWithGitHub = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "read:user repo",
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

  const loginClicked = async () => {
    if (!supabase) return;

    if (!noticeRef.current) return;
    const notice = noticeRef.current;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password: accountPassword,
      });

      if (error) throw error;

      router.push("/home");
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;
      if (error.message.includes("Invalid login credentials")) {
        notice.textContent = t("login.invalidCredentials");
      } else if (error.message.includes("Email not confirmed")) {
        notice.textContent = t("login.emailNotConfirmed");
      } else {
        notice.textContent = error.message;
      }
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="md:hidden"></div>
      <div className="container w-full min-h-screen m-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Button
          variant={"ghost"}
          asChild
          className={cn("absolute right-4 top-4 md:right-8 md:top-8")}
        >
          <Link href="/register">{t("login.createAccount")}</Link>
        </Button>

        <div className="m-auto min-h-screen flex flex-col md:justify-center py-8 md:py-0 space-y-6 w-[96%] md:w-[50%] lg:w-[33%]">
          <div className="bg-sidebar p-8 rounded-sm flex flex-col gap-5">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                {t("login.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("login.description")}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground" htmlFor="email">
                {t("login.email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground" htmlFor="password">
                {t("login.password")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("login.password")}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Label ref={noticeRef} className="text-red-500"></Label>
            <Button type="submit" className="w-full" onClick={loginClicked}>
              {t("login.loginButton")}
            </Button>

            {/* Password Reset Warning Card */}
            <Alert>
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>{t("login.passwordResetWarning.title")}</AlertTitle>
              <AlertDescription>
                {t("login.passwordResetWarning.content")}
              </AlertDescription>
            </Alert>

            {/* Password Reset Link */}
            <div className="text-center">
              <Link
                href="/password-reset"
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>

            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("login.continueWith")}
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-center">
              <Button
                type="submit"
                className="w-full"
                onClick={() => signInWithGoogle()}
              >
                <SiGoogle /> {t("login.googleSignIn")}
              </Button>
              <Button
                type="submit"
                className="w-full"
                onClick={() => signInWithGitHub()}
              >
                <SiGithub /> {t("login.githubSignIn")}
              </Button>
            </div>
            <p className="px-2 text-center text-sm text-muted-foreground">
              {params.locale === "ja" ? (
                <>
                  このサイトにログインすると、
                  <Link
                    href="/infomation/terms"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("login.terms")}
                  </Link>{" "}
                  と{" "}
                  <Link
                    href="/infomation/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("login.privacy")}
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
                    {t("login.terms")}
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/infomation/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("login.privacy")}
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={isDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("login.twoFactorRequired")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("login.twoFactorDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Label className="text-muted-foreground" htmlFor="twoFaCode">
            {t("login.twoFactorCode")}
          </Label>
          <InputOTP
            maxLength={6}
            value={twoFaCode}
            onChange={(e) => setTwoFaCode(e)}
            required
            placeholder="123456"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>
              {t("login.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={closeDialog}>
              {t("login.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
