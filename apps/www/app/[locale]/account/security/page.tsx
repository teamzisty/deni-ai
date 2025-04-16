"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Switch } from "@repo/ui/components/switch";
import { Label } from "@repo/ui/components/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  multiFactor,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
} from "firebase/auth";
import { Input } from "@repo/ui/components/input";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/components/input-otp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { QRCodeSVG } from "qrcode.react";
import { Loading } from "@/components/loading";

// Firebase TOTP Secret型定義を更新
interface TotpSecret {
  secretKey: string;
  generateQrCodeUrl: (email: string, appName: string) => string;
}

export default function SecurityPage() {
  const { user, auth } = useAuth();
  const t = useTranslations("account");
  const router = useRouter();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [totpSecretKey, setTotpSecretKey] = useState("");
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogPromiseRef, setDialogPromiseRef] = useState<{
    resolve: (value: string) => void;
  } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Check if 2FA is enabled
    if (user) {
      const mfaUser = multiFactor(user);
      const enrolledFactors = mfaUser.enrolledFactors;
      setIs2FAEnabled(enrolledFactors && enrolledFactors.length > 0);
    }
  }, [user, t]);

  const handleToggle2FA = async () => {
    if (!user) {
      toast.error(t("security.notLoggedIn"));
      return;
    }

    if (is2FAEnabled) {
      // Disable 2FA
      setShowReauthDialog(true);
      setIsDisabling2FA(true);
    } else {
      // Enable 2FA
      setShowReauthDialog(true);
      setIsEnabling2FA(true);
    }
  };

  const request2FaCode = () => {
    setTotpCode("");
    setError(null);
    setShowVerifyDialog(true);

    return new Promise<string>((resolve) => {
      setDialogPromiseRef({ resolve });
    });
  };

  const close2FADialog = () => {
    setShowVerifyDialog(false);
    if (dialogPromiseRef) {
      dialogPromiseRef.resolve(totpCode);
      setDialogPromiseRef(null);
    }
  };

  const handle2FAReauth = async (error: any) => {
    if (!user || !auth) return false;

    try {
      const resolver = getMultiFactorResolver(auth, error);
      const factor = resolver.hints[0];

      if (factor && factor.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        const tfaCode = await request2FaCode();
        if (!tfaCode) return false;

        const multiFactorAssertion =
          TotpMultiFactorGenerator.assertionForSignIn(factor.uid, tfaCode);

        await resolver.resolveSignIn(multiFactorAssertion);
        return true;
      }

      setError(t("security.errorVerifying"));
      return false;
    } catch (error: any) {
      console.error("2FA reauth error:", error);
      setError(error.message);
      return false;
    }
  };

  const reauthenticateWithGoogle = async () => {
    if (!user) return false;

    try {
      setIsAuthenticating(true);
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      return true;
    } catch (error: any) {
      console.error("Google reauth error:", error);
      if (error.code === "auth/multi-factor-auth-required") {
        return await handle2FAReauth(error);
      }
      setError(error.message);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const reauthenticateWithGitHub = async () => {
    if (!user) return false;

    try {
      setIsAuthenticating(true);
      const provider = new GithubAuthProvider();
      await reauthenticateWithPopup(user, provider);
      return true;
    } catch (error: any) {
      console.error("GitHub reauth error:", error);
      if (error.code === "auth/multi-factor-auth-required") {
        return await handle2FAReauth(error);
      }
      setError(error.message);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const reauthenticateWithPassword = async () => {
    if (!user || !user.email) return false;

    try {
      setIsAuthenticating(true);
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error: any) {
      console.error("Password reauth error:", error);
      if (error.code === "auth/multi-factor-auth-required") {
        return await handle2FAReauth(error);
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setError(t("security.invalidPassword"));
      } else {
        setError(error.message);
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!user) {
      toast.error(t("security.notLoggedIn"));
      return;
    }

    setError(null);
    setIsAuthenticating(true);

    // Check the authentication provider
    const provider = user.providerData[0]?.providerId;
    let success = false;

    try {
      if (provider === "password") {
        success = await reauthenticateWithPassword();
      } else if (provider === "google.com") {
        success = await reauthenticateWithGoogle();
      } else if (provider === "github.com") {
        success = await reauthenticateWithGitHub();
      } else {
        // Default to password auth if provider is unknown
        success = await reauthenticateWithPassword();
      }

      if (success) {
        if (isEnabling2FA) {
          try {
            // 実際のTOTP設定を開始
            const multiFactorSession = await multiFactor(user).getSession();

            // TOTP secret生成
            const totpVerifier =
              await TotpMultiFactorGenerator.generateSecret(multiFactorSession);

            // QRコードのURLを生成
            const appName = "Deni AI";
            const qrCodeUrl = totpVerifier.generateQrCodeUrl(
              user.email || "user@example.com",
              appName
            );

            // 状態を更新
            setTotpSecret(totpVerifier);
            setQrCodeUrl(qrCodeUrl);
            setTotpSecretKey(totpVerifier.secretKey);
            setShowQRCode(true);
            setShowReauthDialog(false);
          } catch (error: any) {
            console.error("Error setting up 2FA:", error);
            toast.error(t("security.setupError"), {
              description: error.message,
            });
          }
        } else if (isDisabling2FA) {
          try {
            // 登録されている2FA要素を取得
            const mfaUser = multiFactor(user);
            const enrolledFactors = mfaUser.enrolledFactors;

            if (enrolledFactors && enrolledFactors.length > 0) {
              // 最初の要素を解除（通常はTOTP）
              if (enrolledFactors[0] && enrolledFactors[0].uid) {
                await mfaUser.unenroll(enrolledFactors[0].uid);
                toast.success(t("security.disabled2FA"));
                setIs2FAEnabled(false);
              }
            }
            setShowReauthDialog(false);
            setIsDisabling2FA(false);
          } catch (error: any) {
            console.error("Error disabling 2FA:", error);
            toast.error(t("security.disableError"), {
              description: error.message,
            });
          }
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!totpSecret || !user) return;

    setError(null);

    try {
      // 6桁のコードを検証
      if (!/^\d{6}$/.test(totpCode)) {
        setError(t("security.errorVerifying"));
        return;
      }

      // 本物のTOTP検証
      const mfaUser = multiFactor(user);

      // TOTPのアサーションを作成 - anyでキャストして型エラーを回避
      const credential = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret as any,
        totpCode
      );

      // エンロール（登録）処理
      await mfaUser.enroll(credential, "TOTP");

      toast.success(t("security.enabled2FA"));
      setIs2FAEnabled(true);
      setShowVerifyDialog(false);
      setIsEnabling2FA(false);
      setShowQRCode(false);
    } catch (error: any) {
      console.error("Error verifying 2FA:", error);
      setError(error.message || t("security.errorVerifying"));
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return t("security.timeFormat.today", {
        time: date.toLocaleTimeString(),
      });
    } else if (diffInHours < 48) {
      return t("security.timeFormat.yesterday", {
        time: date.toLocaleTimeString(),
      });
    } else {
      return t("security.timeFormat.daysAgo", {
        days: Math.floor(diffInHours / 24),
        time: date.toLocaleTimeString(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("security.title")}
        </h2>
        <p className="text-muted-foreground">{t("security.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("security.twoFactor.title")}</CardTitle>
          <CardDescription>
            {t("security.twoFactor.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-y-0">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="two-factor">
                {t("security.twoFactor.label")}
              </Label>
              <span className="text-sm text-muted-foreground">
                {t("security.twoFactor.sublabel")}
              </span>
            </div>
            <Switch
              id="two-factor"
              checked={is2FAEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={!user || isEnabling2FA || isDisabling2FA}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reauthentication Dialog */}
      <AlertDialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("security.reauth.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("security.reauth.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isAuthenticating ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loading />
            </div>
          ) : user?.providerData[0]?.providerId === "password" ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("password.title")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("password.title")}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p>
                {t("security.reauth.providerMessage", {
                  provider:
                    user?.providerData[0]?.providerId === "google.com"
                      ? "Google"
                      : "GitHub",
                })}
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowReauthDialog(false);
                setIsEnabling2FA(false);
                setIsDisabling2FA(false);
              }}
              disabled={isAuthenticating}
            >
              {t("security.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReauthenticate}
              disabled={isAuthenticating}
            >
              {t("security.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <AlertDialog open={showQRCode} onOpenChange={setShowQRCode}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("security.qrCode.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("security.qrCode.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="bg-white p-2 rounded-lg">
              {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}
            </div>

            <div className="text-center">
              <p className="text-sm mb-2">{t("security.qrCode.manualEntry")}</p>
              <p className="font-mono bg-muted p-2 rounded text-sm select-all">
                {totpSecretKey}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowQRCode(false);
                setIsEnabling2FA(false);
              }}
            >
              {t("security.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowQRCode(false);
                setShowVerifyDialog(true);
              }}
            >
              {t("security.qrCode.next")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Code Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("security.verify.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("security.verify.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="flex gap-2">
              <InputOTP
                maxLength={6}
                value={totpCode}
                onChange={(value) => setTotpCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (dialogPromiseRef) {
                  close2FADialog();
                } else {
                  setShowVerifyDialog(false);
                  setIsEnabling2FA(false);
                }
              }}
            >
              {t("security.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogPromiseRef) {
                  close2FADialog();
                } else {
                  handleVerify2FA();
                }
              }}
            >
              {t("security.verify.verifyButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
