"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AlertCircle, ArrowLeft, Check, Mail } from "lucide-react";

const PasswordReset: React.FC = () => {
  const t = useTranslations();
  const { supabase } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t("login.invalidEmail"));
      return;
    }

    if (!supabase) {
      toast.error(t("common.error.occurred"));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset/confirm`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast.success(t("login.passwordReset.resetLinkSent"));
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(t("login.passwordReset.resetLinkError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="h-screen w-full">
        <div className="container w-full h-screen m-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
          <Button
            variant={"ghost"}
            asChild
            className={cn("absolute right-4 top-4 md:right-8 md:top-8")}
          >
            <Link href="/login">{t("login.passwordReset.backToLogin")}</Link>
          </Button>

          <div className="m-auto h-screen flex flex-col justify-center space-y-6 w-[96%] md:w-[50%] lg:w-[33%]">
            <Card className="border border-border/30">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  {t("login.passwordReset.title")}
                </CardTitle>
                <CardDescription>
                  {t("login.passwordReset.resetLinkSent")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <p className="font-medium">{email}</p>
                </div>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("login.passwordReset.backToLogin")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="container w-full h-screen m-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Button
          variant={"ghost"}
          asChild
          className={cn("absolute right-4 top-4 md:right-8 md:top-8")}
        >
          <Link href="/login">{t("login.passwordReset.backToLogin")}</Link>
        </Button>

        <div className="m-auto h-screen flex flex-col justify-center space-y-6 w-[96%] md:w-[50%] lg:w-[33%]">
          <Card className="border border-border/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {t("login.passwordReset.title")}
              </CardTitle>
              <CardDescription>
                {t("login.passwordReset.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t("login.passwordReset.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="mail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("login.passwordReset.sending")}
                    </>
                  ) : (
                    t("login.passwordReset.sendResetLink")
                  )}
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("login.passwordReset.backToLogin")}
                  </Link>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
