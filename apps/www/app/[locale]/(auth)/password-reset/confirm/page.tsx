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
import { Lock } from "lucide-react";

const PasswordResetConfirm: React.FC = () => {
  const t = useTranslations();
  const { supabase } = useAuth({ authRequired: false });
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError(t("login.passwordResetConfirm.errors.fillAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("login.passwordResetConfirm.errors.passwordsDontMatch"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("login.passwordResetConfirm.errors.passwordTooShort"));
      return;
    }

    if (!supabase) {
      setError(t("login.passwordResetConfirm.errors.authUnavailable"));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      toast.success(t("login.passwordResetConfirm.success.message"));
      router.push("/login");
    } catch (error: any) {
      console.error("Password update error:", error);
      if (error.message?.includes("Password should be at least")) {
        setError(t("login.passwordResetConfirm.errors.passwordTooWeak"));
      } else {
        setError(
          error.message || t("login.passwordResetConfirm.errors.updateFailed"),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="container w-full min-h-screen m-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
        {" "}
        <Button
          variant={"ghost"}
          asChild
          className={cn("absolute right-4 top-4 md:right-8 md:top-8")}
        >
          <Link href="/login">
            {t("login.passwordResetConfirm.backToLogin")}
          </Link>
        </Button>
        <div className="m-auto min-h-screen flex flex-col md:justify-center py-8 md:py-0 space-y-6 w-[96%] md:w-[50%] lg:w-[33%]">
          <Card className="border border-border/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>{" "}
              <CardTitle className="text-2xl font-bold">
                {t("login.passwordResetConfirm.title")}
              </CardTitle>
              <CardDescription>
                {t("login.passwordResetConfirm.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {t("login.passwordResetConfirm.newPassword")}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t(
                      "login.passwordResetConfirm.newPasswordPlaceholder",
                    )}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("login.passwordResetConfirm.confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t(
                      "login.passwordResetConfirm.confirmPasswordPlaceholder",
                    )}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  {" "}
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("login.passwordResetConfirm.updatingPassword")}
                    </>
                  ) : (
                    t("login.passwordResetConfirm.updatePassword")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;
