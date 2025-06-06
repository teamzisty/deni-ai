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
import { authService } from "@/lib/auth/client";

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
  const [isPendingMFA, setIsPendingMFA] = useState(false);
  const [isVerifyingMFA, setIsVerifyingMFA] = useState(false);

  useEffect(() => {
    if (!supabase && !isLoading) {
      toast.error(t("common.error.occurred"), {
        description: t("account.authDisabled"),
      });
      router.push("/");
    }

    if (user && !isLoading) {
      router.push("/");
    }
  }, [user, isLoading, router, t, supabase]);
  const closeDialog = () => {
    setIsDialogOpen(false);
    setTwoFaCode("");
    setIsPendingMFA(false);
    setIsVerifyingMFA(false);
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
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
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      if (noticeRef.current && error instanceof Error) {
        noticeRef.current.textContent = error.message;
      }
    }
  };
  const loginWithForm = async (formData: FormData) => {
    if (!noticeRef.current) return;
    const notice = noticeRef.current;

    try {
      await authService.loginWithForm(formData);
      router.push("/");
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;
      
      // Check if MFA is required
      if (error.message.includes("MFA")) {
        // Extract email from form for MFA flow
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        setEmail(email);
        setPassword(password);
        setIsPendingMFA(true);
        setIsDialogOpen(true);
        return;
      }
      
      if (error.message.includes("Invalid login credentials")) {
        notice.textContent = t("login.invalidCredentials");
      } else if (error.message.includes("Email not confirmed")) {
        notice.textContent = t("login.emailNotConfirmed");
      } else {
        notice.textContent = error.message;
      }
    }
  };
  const loginClicked = async () => {
    if (!supabase) return;

    if (!noticeRef.current) return;
    const notice = noticeRef.current;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password: accountPassword,
      });

      if (error) {
        // Check if MFA is required
        if (error.message.includes("MFA")) {
          // User needs to complete MFA challenge
          setIsPendingMFA(true);
          setIsDialogOpen(true);
          return;
        }
        throw error;
      }      // Check if user has MFA enabled
      if (data.session && data.user) {
        // Get MFA factors to check if user has MFA enabled
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasMFA = factors?.totp && factors.totp.length > 0;

        // If user has MFA enabled, we should verify the session was completed with MFA
        // For Supabase, we can check if we need to challenge by attempting to get a fresh session
        if (hasMFA) {
          try {
            // Attempt to get the current session to see if it's fully authenticated
            const { data: sessionCheck } = await supabase.auth.getSession();
            
            // If the session exists but we still have MFA factors, check if MFA verification is needed
            // In Supabase, a successful MFA login should be complete, but we can verify by
            // checking if the session is recent and properly authenticated
            if (sessionCheck.session) {
              // Session is valid and MFA was likely completed during login
              // Continue with normal flow
            } else {
              // Session might be incomplete, prompt for MFA
              setIsPendingMFA(true);
              setIsDialogOpen(true);
              return;
            }
          } catch (sessionError) {
            // If there's an error getting the session, it might indicate incomplete MFA
            console.warn("Session check failed, may need MFA verification:", sessionError);
            setIsPendingMFA(true);
            setIsDialogOpen(true);
            return;
          }
        }
      }

      router.push("/");
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

  const verifyMFA = async () => {
    if (!supabase || !twoFaCode) return;

    if (!noticeRef.current) return;
    const notice = noticeRef.current;

    setIsVerifyingMFA(true);

    try {
      // Get the first available MFA factor
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) {
        throw new Error("No MFA factor found");
      }

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: twoFaCode,
      });

      if (error) throw error;

      closeDialog();
      router.push("/");
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;
      if (error.message.includes("Invalid TOTP code")) {
        notice.textContent = t("login.invalidTwoFactorCode");
      } else {
        notice.textContent = error.message;
      }
    } finally {
      setIsVerifyingMFA(false);
    }
  };

  return (
    <main className="overflow-y-auto max-h-screen">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("login.title")}</CardTitle>
            <CardDescription>{t("login.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" action={loginWithForm}>
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mail@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("login.password")}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Label ref={noticeRef} className="text-red-500"></Label>{" "}
              <Button className="w-full" type="submit">
                {t("login.loginButton")}
              </Button>
            </form>

            {/* Two-Factor Authentication Dialog */}

            {/* Password Reset Warning Card */}
            <Alert>
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>{t("login.passwordResetWarning.title")}</AlertTitle>
              <AlertDescription>
                {t("login.passwordResetWarning.content")}
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Link
                href="/password-reset"
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>

            <div className="text-center">
              <Link
                href={`/register`}
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 underline"
              >
                {t("login.createAccount")}
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
                onClick={signInWithGoogle}
              >
                <SiGoogle className="mr-2 h-4 w-4" />
                {t("login.googleSignIn")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={signInWithGitHub}
              >
                <SiGithub className="mr-2 h-4 w-4" />
                {t("login.githubSignIn")}
              </Button>

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
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={isDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("login.twoFactorRequired")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("login.twoFactorDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="twoFaCode">{t("login.twoFactorCode")}</Label>
              <InputOTP maxLength={6} value={twoFaCode} onChange={setTwoFaCode}>
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
            </div>{" "}
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={closeDialog}
                disabled={isVerifyingMFA}
              >
                {t("login.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={verifyMFA}
                disabled={isVerifyingMFA || twoFaCode.length !== 6}
              >
                {isVerifyingMFA ? t("login.verifying") : t("login.continue")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
};

export default Login;
