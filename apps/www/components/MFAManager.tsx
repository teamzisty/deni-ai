"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";
import { MFAEnrollment } from "./MFAEnrollment";

interface MFAFactor {
  id: string;
  factor_type: string;
  friendly_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function MFAManager() {
  const t = useTranslations("account.security");
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [error, setError] = useState<string>("");

  // Create Supabase client instance
  const supabase = createClient();

  useEffect(() => {
    loadMFAFactors();
  }, []);

  const loadMFAFactors = async () => {
    if (!supabase) {
      setError("Supabase is not initialized");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      setFactors(data?.totp || []);
    } catch (err: any) {
      console.error("Error loading MFA factors:", err);
      setError(err.message || "Failed to load MFA settings");
    } finally {
      setIsLoading(false);
    }
  };

  const unenrollMFA = async (factorId: string) => {
    if (!supabase) {
      setError("Supabase is not initialized");
      return;
    }

    setIsUnenrolling(true);
    setError("");

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });
      if (error) throw error;

      toast.success(t("disabled2FA"));
      await loadMFAFactors();
    } catch (err: any) {
      console.error("MFA unenrollment error:", err);
      setError(err.message || "Failed to disable MFA");
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleEnrollmentSuccess = async () => {
    setIsEnrolling(false);
    await loadMFAFactors();
  };

  const handleEnrollmentCancel = () => {
    setIsEnrolling(false);
  };

  const enabledFactors = factors.filter((f) => f.status === "verified");
  const hasMFA = enabledFactors.length > 0;

  if (isLoading) {
    return (
      <Card>
        {" "}
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading MFA settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEnrolling) {
    return (
      <MFAEnrollment
        onSuccess={handleEnrollmentSuccess}
        onCancel={handleEnrollmentCancel}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {" "}
            <CardTitle className="flex items-center space-x-2">
              {hasMFA ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <Shield className="h-5 w-5 text-gray-400" />
              )}
              <span>{t("twoFactor.title")}</span>
            </CardTitle>
            <CardDescription>{t("twoFactor.description")}</CardDescription>
          </div>{" "}
          <Badge variant={hasMFA ? "default" : "secondary"}>
            {hasMFA ? t("enabled") : t("disabled")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasMFA ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />{" "}
                <span className="font-medium text-green-800 dark:text-green-200">
                  {t("enabledStatus")}
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {t("enabledDescription")}
              </p>
            </div>{" "}
            <div className="space-y-2">
              <h4 className="font-medium">{t("activeAuthenticators")}</h4>
              {enabledFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{t("totpAuthenticator")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("addedOn", {
                        date: new Date(factor.created_at).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unenrollMFA(factor.id)}
                    disabled={isUnenrolling}
                  >
                    {isUnenrolling && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("disable")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              {" "}
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  {t("disabledStatus")}
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t("disabledDescription")}
              </p>
            </div>

            <Button onClick={() => setIsEnrolling(true)} className="w-full">
              {t("setupButton")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
