"use client";

import React, { useRef, useState } from "react";
import { auth } from "@repo/firebase-config/client";
import { useTranslations } from "next-intl";
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import { Input } from "@repo/ui/components/input";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@repo/ui/components/input-otp";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { useParams } from "next/navigation";

const Login: React.FC = () => {
  const t = useTranslations();
  const noticeRef = useRef<HTMLLabelElement | null>(null);
  const dialogPromiseRef = useRef<{ resolve: (value: string) => void } | null>(
    null
  );
  const params = useParams();

  const [twoFaCode, setTwoFaCode] = useState(""); // 2FAコードの状態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountEmail, setEmail] = useState("");
  const [accountPassword, setPassword] = useState("");

  auth.onAuthStateChanged((user) => {
    if (user) window.location.pathname = "/home";
  });
  const request2FaCode = () => {
    return new Promise<string>((resolve) => {
      // ダイアログを開く
      setIsDialogOpen(true);
      // ダイアログを閉じたときに resolve する
      dialogPromiseRef.current = { resolve };
    });
  };

  // ダイアログを閉じる処理
  const closeDialog = () => {
    setIsDialogOpen(false);
    if (dialogPromiseRef.current) {
      // ダイアログが閉じたら入力された2FAコードをresolveで返す
      dialogPromiseRef.current.resolve(twoFaCode);
      dialogPromiseRef.current = null;
    }
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        window.location.pathname = "/home";
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorContent = error.message;
        if (noticeRef.current) {
          noticeRef.current.textContent =
            errorContent + " (エラーコード: " + errorCode + ")";
        }
      });
  };

  const signInWithGitHub = () => {
    const provider = new GithubAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        window.location.pathname = "/home";
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorContent = error.message;
        if (noticeRef.current) {
          noticeRef.current.textContent =
            errorContent + " (エラーコード: " + errorCode + ")";
        }
      });
  };

  const loginClicked = async () => {
    if (!noticeRef.current) return;
    const notice = noticeRef.current;
    signInWithEmailAndPassword(auth, accountEmail, accountPassword)
      .then(() => {
        window.location.pathname = "/home";
      })
      .catch(async (error) => {
        const errorCode = error.code;
        const errorContent = error.message;

        if (errorCode == "auth/user-not-found") {
          notice.textContent = t("login.userNotFound");
        } else if (
          errorCode == "auth/invalid-password" ||
          errorCode == "auth/invalid-credential"
        ) {
          notice.textContent = t("login.invalidCredentials");
        } else if (errorCode == "auth/multi-factor-auth-required") {
          const mfaResolver = getMultiFactorResolver(auth, error);

          const resolver = getMultiFactorResolver(auth, error);

          // Ask user which second factor to use.
          const factor = resolver.hints[0];
          if (factor) {
            if (factor.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
              const tfaCode = await request2FaCode();
              if (!tfaCode) return;
              const multiFactorAssertion =
                TotpMultiFactorGenerator.assertionForSignIn(
                  factor.uid,
                  tfaCode
                );
              try {
                await mfaResolver
                  .resolveSignIn(multiFactorAssertion)
                  .then(() => {
                    window.location.pathname = "/home";
                  });
              } catch (e) {
                console.error(
                  "An error occurred while resolving multi-factor sign-in: ",
                  e
                );
                notice.textContent = t("login.invalidAuthCode");
              }
            }
          } else {
            notice.textContent = t("login.invalidAuthCode");
          }
        } else if (errorCode == "auth/too-many-requests") {
          notice.textContent = t("login.tooManyRequests");
        } else if (errorCode == "auth/invalid-email") {
          notice.textContent = t("login.invalidEmail");
        } else if (errorCode == "auth/user-disabled") {
          notice.textContent = t("login.accountDisabled");
        } else {
          notice.textContent = t("login.otherError.replace", {errorContent: errorContent});
        }
      });
  };

  return (
    <div className="h-screen w-full">
      <div className="md:hidden"></div>
      <div className="container w-full h-screen m-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Button
          variant={"ghost"}
          asChild
          className={cn("absolute right-4 top-4 md:right-8 md:top-8")}
        >
          <Link href="/register">{t("login.createAccount")}</Link>
        </Button>

        <div className="m-auto h-screen flex flex-col justify-center space-y-6 w-[96%] md:w-[50%] lg:w-[33%]">
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
            <Button
              type="submit"
              className="w-full"
              onClick={loginClicked}
            >
              {t("login.loginButton")}
            </Button>

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
