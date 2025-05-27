"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Check,
  ChevronRight,
  Loader,
  User,
  Plus,
  XIcon,
  CheckCircle2,
  AlertTriangle,
  Mail,
  LogOut,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { Link, useRouter } from "@/i18n/navigation";
import { Footer } from "@/components/footer";
import { Loading } from "@/components/loading";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { useUploadThing } from "@/utils/uploadthing";
import { useAuth } from "@/context/AuthContext";
import { StatusAlert } from "@/components/StatusAlert";
import { supabase } from "@workspace/supabase-config/client";

// ウィザードのステップを定義
enum WizardStep {
  Language = 0,
  VerifyEmail = 1,
  Profile = 2,
  Theme = 3,
  Start = 4,
}

const GettingStartedWizard: React.FC = () => {
  const t = useTranslations();
  const { createSession } = useChatSessions();
  const [creating, setCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, sendVerificationEmail } = useAuth();

  // ウィザードの状態管理
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    WizardStep.Language
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    (params.locale as string) || "ja"
  );
  const [displayName, setDisplayName] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [currentAuthToken, setCurrentAuthToken] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [sendingVerification, setSendingVerification] =
    useState<boolean>(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);

  // プロフィール更新中の状態
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // uploadthing フックの設定
  const { startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: user ? currentAuthToken || "" : "",
    },
    onClientUploadComplete: (res) => {
      setPhotoURL(res[0]?.ufsUrl || "");
      setIsUploading(false);
    },
    onUploadError: (error: Error) => {
      toast.error(t("profile.uploadError"), {
        description: error.message,
      });
      setIsUploading(false);
    },
  });

  // 次のステップに進む
  const goToNextStep = () => {
    // Handle progression through the wizard steps
    if (currentStep === WizardStep.Language && emailVerified) {
      // If email is already verified, skip the verification step
      setCurrentStep(WizardStep.Profile);
    } else if (currentStep === WizardStep.VerifyEmail && displayName) {
      // If user already has a display name, skip the profile step
      setCurrentStep(WizardStep.Theme);
    } else {
      // Otherwise, move to the next step
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        return nextStep <= WizardStep.Start ? nextStep : WizardStep.Start;
      });
    }
  };

  // 前のステップに戻る
  const goToPreviousStep = () => {
    setCurrentStep((prev) => (prev > WizardStep.Language ? prev - 1 : prev));
  };

  // 言語を変更する
  const changeLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    router.push("/getting-started", { locale: lang });
  };

  // メール検証のステップをスキップ（ユーザーがアプリを使いたい場合）
  const skipEmailVerification = () => {
    if (user && !displayName) {
      setCurrentStep(WizardStep.Profile);
    } else {
      setCurrentStep(WizardStep.Start);
    }
  };

  // 確認メールを送信する
  const handleSendVerificationEmail = async () => {
    // メール送信間隔制限（60秒）
    if (lastSentTime && Date.now() - lastSentTime < 60000) {
      const remainingSeconds = Math.ceil(
        (60000 - (Date.now() - lastSentTime)) / 1000
      );
      toast.error(t("common.error.tooManyRequests"), {
        description: t("wizard.email.throttled", { seconds: remainingSeconds }),
      });
      return;
    }

    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      setLastSentTime(Date.now());
      toast.success(t("wizard.email.sent"));
    } catch (error) {
      console.error("確認メール送信エラー:", error);
      toast.error(t("wizard.email.error"));
    } finally {
      setSendingVerification(false);
    }
  };
  // メール確認状態をチェックする
  const checkEmailVerification = async () => {
    if (!user) return;

    try {
      // Supabase では user.email_confirmed_at で確認済みかどうかを判定
      const isVerified = !!user.email_confirmed_at;
      setEmailVerified(isVerified);

      if (isVerified) {
        // メール確認済みの場合、次のステップへ
        toast.success(t("wizard.email.verified"));
        goToNextStep();
      } else {
        toast.error(t("wizard.email.notVerified"));
      }
    } catch (error) {
      console.error("メール確認状態チェックエラー:", error);
      toast.error(t("common.error.generic"));
    }
  };

  // 画像アップロード処理
  const uploadImage = async (file?: File) => {
    if (!file) {
      toast.error(t("common.error.fileNotSelected"));
      return;
    }

    setIsUploading(true);    try {
      if (user) {
        const idToken = user.id;
        if (idToken) {
          setCurrentAuthToken(idToken);
        }
      }

      await startUpload([
        new File([file], `${crypto.randomUUID()}.png`, {
          type: file.type,
        }),
      ]);
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      toast.error(t("profile.uploadError"));
      setIsUploading(false);
    }
  };

  // 画像アップロードハンドラー
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target?.files;
    if (!files || files.length === 0) return;

    await uploadImage(files[0]);
  };
  // プロフィールを更新する
  const updateUserProfile = async () => {
    if (!user || !supabase) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          avatar_url: photoURL || null,
        }
      });
      
      if (error) throw error;
      
      toast.success(t("profile.updateSuccess"));
      goToNextStep();
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast.error(t("profile.updateError"));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // テーマを適用する
  const applyTheme = () => {
    goToNextStep();
  };

  // 新しいセッションを作成して開始
  const handleNewSession = () => {
    setCreating(true);

    const randomNumber = Math.floor(Math.random() * (750 - 350 + 1)) + 350;

    setTimeout(() => {
      const session = createSession();
      router.push(`/chat/${session.id}`);
    }, randomNumber);
  };
  // 認証状態の確認
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // メール確認状態を設定
    setEmailVerified(!!user.email_confirmed_at);

    // ユーザー情報を初期値として設定
    if (user.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
    if (user.user_metadata?.avatar_url) {
      setPhotoURL(user.user_metadata.avatar_url);
    }

    // メール確認が必要なステップを決定
    if (!user.email_confirmed_at) {
      setCurrentStep(WizardStep.Language);
    } else if (!user.user_metadata?.display_name) {
      setCurrentStep(WizardStep.Profile);
    }

    setIsLoading(false);
  }, [router, user]);

  if (isLoading) {
    return <Loading />;
  }

  // ステップに応じたコンテンツを表示
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.Language:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {t("wizard.language.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("wizard.language.description")}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                variant={selectedLanguage === "ja" ? "default" : "outline"}
                className="justify-between"
                onClick={() => changeLanguage("ja")}
              >
                <span>日本語</span>
                {selectedLanguage === "ja" && <Check className="h-4 w-4" />}
              </Button>

              <Button
                variant={selectedLanguage === "en" ? "default" : "outline"}
                className="justify-between"
                onClick={() => changeLanguage("en")}
              >
                <span>English</span>
                {selectedLanguage === "en" && <Check className="h-4 w-4" />}
              </Button>
            </div>

            {displayName && (
              <StatusAlert
                type="info"
                title={t("wizard.already.title")}
                description={
                  <>
                    {t("wizard.already.description")}
                    <div className="flex mt-2">
                      <Button>
                        <Link href="/home">{t("wizard.start.button")}</Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => setCurrentStep(WizardStep.Start)}
                      >
                        {t("wizard.already.button")}
                      </Button>
                    </div>
                  </>
                }
                show={!!displayName}
                className="text-left mb-4 w-full"
              />
            )}

            <Button
              className="w-full"
              onClick={() => {
                goToNextStep();
              }}
            >
              {t("wizard.next")} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case WizardStep.VerifyEmail:
        // Original email verification step for unverified emails
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {t("wizard.email.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("wizard.email.description")}
              </p>
            </div>

            <StatusAlert
              type="error"
              title={t("wizard.email.alert.title")}
              description={t("wizard.email.alert.description")}
              show={true}
              className="mb-4"
            />

            <div className="flex flex-col items-center gap-4 mt-6">
              <Button
                className="w-full"
                onClick={handleSendVerificationEmail}
                disabled={sendingVerification}
              >
                {sendingVerification ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {t("wizard.email.sending")}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t("wizard.email.sendButton")}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={checkEmailVerification}
              >
                <Check className="mr-2 h-4 w-4" />
                {t("wizard.email.checkButton")}
              </Button>              <Button
                variant="link"
                className="w-full"
                onClick={() => supabase?.auth.signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("accountMenu.logout")}
              </Button>

              <Button
                variant="link"
                className="text-muted-foreground"
                onClick={skipEmailVerification}
              >
                {t("wizard.email.skipButton")}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={goToPreviousStep}
              className="w-full"
            >
              {t("wizard.back")}
            </Button>
          </div>
        );

      case WizardStep.Profile:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {t("wizard.profile.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("wizard.profile.description")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 mx-auto mb-6">
              {isUploading ? (
                <div className="h-24 w-24 rounded-full flex items-center justify-center bg-muted">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoURL} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
              )}
              <p>{displayName ? displayName : "Name"}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("wizard.profile.name")}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("wizard.profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoURL">{t("wizard.profile.avatar")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="photoURL"
                    disabled={isUploading}
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder={t("wizard.profile.avatarPlaceholder")}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {photoURL && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setPhotoURL("")}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("wizard.profile.avatarHelp")}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={goToPreviousStep}>
                {t("wizard.back")}
              </Button>
              <Button
                className="flex-1"
                onClick={updateUserProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />{" "}
                    {t("wizard.profile.updating")}
                  </>
                ) : (
                  <>
                    {t("wizard.next")} <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case WizardStep.Theme:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {t("wizard.theme.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("wizard.theme.description")}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="justify-between"
                onClick={() => setTheme("light")}
              >
                <span>{t("common.themes.light")}</span>
                {theme === "light" && <Check className="h-4 w-4" />}
              </Button>

              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="justify-between"
                onClick={() => setTheme("dark")}
              >
                <span>{t("common.themes.dark")}</span>
                {theme === "dark" && <Check className="h-4 w-4" />}
              </Button>

              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="justify-between"
                onClick={() => setTheme("system")}
              >
                <span>{t("settings.general.theme.system")}</span>
                {theme === "system" && <Check className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={goToPreviousStep}>
                {t("wizard.back")}
              </Button>
              <Button className="flex-1" onClick={applyTheme}>
                {t("wizard.next")} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case WizardStep.Start:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {t("wizard.start.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("wizard.start.description")}
              </p>
            </div>

            {!emailVerified && (
              <StatusAlert
                type="warning"
                title={t("wizard.email.reminder.title")}
                description={
                  <>
                    {t("wizard.email.reminder.description")}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleSendVerificationEmail}
                      disabled={sendingVerification}
                    >
                      {sendingVerification ? (
                        <Loader className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-3 w-3" />
                      )}
                      {t("wizard.email.sendButtonShort")}
                    </Button>
                  </>
                }
                show={!emailVerified}
                className="mb-4"
              />
            )}

            <div className="flex items-center gap-4 mt-6">
              <Button variant="outline" onClick={goToPreviousStep}>
                {t("wizard.back")}
              </Button>
              <Button onClick={handleNewSession} className="flex-1">
                {creating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />{" "}
                    {t("home.creating")}
                  </>
                ) : (
                  <>
                    <Check />
                    {t("wizard.start.button")}
                  </>
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="w-full flex">
      <div
        className={cn(
          "flex flex-col flex-1 w-full md:w-9/12 mr-0 md:mr-16 ml-3 p-4 h-screen"
        )}
      >
        <br />

        <div className="flex items-center flex-col w-full md:w-7/12 m-auto">
          <h1 className="m-auto text-xl lg:text-3xl mb-1 font-bold">
            {t("wizard.title")}
          </h1>

          {/* ステップインジケーター */}
          <div className="flex justify-center gap-2 mb-6 mt-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full",
                  currentStep === index
                    ? "bg-primary"
                    : currentStep > index
                      ? "bg-primary/70"
                      : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* ステップコンテンツ */}
          <div className="w-full max-w-md">{renderStepContent()}</div>
        </div>

        <Footer />
      </div>
    </main>
  );
};

export default GettingStartedWizard;
