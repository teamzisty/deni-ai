"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { supabase } from "@workspace/supabase-config/client";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";

interface MFAEnrollmentProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAEnrollment({ onSuccess, onCancel }: MFAEnrollmentProps) {
  const t = useTranslations("account.security");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>("");
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    if (!supabase) {
      setError("Supabase is not initialized");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Generate a unique friendly name with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:\-T]/g, "");
      const friendlyName = `TOTP-${timestamp}-${crypto.randomUUID()}`;

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: friendlyName,
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.uri);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (err: any) {
      console.error("MFA enrollment error:", err);
      if (
        err.message?.includes("friendly name") &&
        err.message?.includes("already exists")
      ) {
        setError(t("duplicateFactorError"));
      } else {
        setError(t("enrollmentFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!supabase || !factorId || !verificationCode) {
      setError("Missing required data for verification");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      toast.success(t("enabled2FA"));
      onSuccess();
    } catch (err: any) {
      console.error("MFA verification error:", err);
      if (err.message?.includes("Invalid TOTP code")) {
        setError(t("errorVerifying"));
      } else {
        setError(err.message || "Failed to verify and enable MFA");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      toast.success(t("secretCopied"));
      setTimeout(() => setSecretCopied(false), 2000);
    } catch (err) {
      toast.error(t("secretCopyFailed"));
    }
  };
  const renderQRCode = () => {
    try {
      // Check if QR code data is too long (typical limit is around 2953 characters for high error correction)
      if (qrCode.length > 2900) {
        return (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">
              {t("qrCodeTooLarge")}
            </p>
          </div>
        );
      }
      return <QRCodeSVG value={qrCode} size={200} level="M" />;
    } catch (err) {
      console.error("QR Code generation error:", err);
      return (
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">{t("qrCodeError")}</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("settingUp")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("qrCode.title")}</CardTitle>
        <CardDescription>{t("qrCode.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {qrCode && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">{t("scanQrCode")}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t("scanQrDescription")}
              </p>
              <div className="flex justify-center mt-4 p-4 bg-white rounded-lg border">
                {renderQRCode()}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">
                {t("enterCodeManually")}
              </Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                  disabled={secretCopied}
                >
                  {secretCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label
                htmlFor="verificationCode"
                className="text-base font-medium"
              >
                {t("enterVerificationCode")}
              </Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder={t("codePlaceholder")}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(value);
                }}
                className="mt-2 text-center text-lg font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={verifyAndEnable}
                disabled={isVerifying || verificationCode.length !== 6}
                className="flex-1"
              >
                {isVerifying && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isVerifying ? t("verifying") : t("enable2FA")}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isVerifying}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
