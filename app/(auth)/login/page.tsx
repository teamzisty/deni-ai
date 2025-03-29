"use client";

import React, { useRef, useState } from "react";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Link } from 'next-view-transitions';
import { cn } from "@/lib/utils";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import {
  CloudUpload,
  FlaskConical,
  MessageCircle,
  Sparkle,
  Zap,
} from "lucide-react";

const Login: React.FC = () => {
  const noticeRef = useRef<HTMLLabelElement | null>(null);
  const dialogPromiseRef = useRef<{ resolve: (value: string) => void } | null>(
    null
  );

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
          notice.textContent = "ユーザーが見つかりませんでした";
        } else if (
          errorCode == "auth/invalid-password" ||
          errorCode == "auth/invalid-credential"
        ) {
          notice.textContent = "メールアドレスかパスワードが間違っています";
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
                notice.textContent =
                  "無効な認証コードです。もう一度お試しください。";
              }
            }
          } else {
            notice.textContent =
              "2段階認証が一時的に利用できません。もう一度お試しください。";
          }
        } else if (errorCode == "auth/too-many-requests") {
          notice.textContent =
            "短時間にリクエストを送信しすぎています。しばらく待ってからお試しください";
        } else if (errorCode == "auth/invalid-email") {
          notice.textContent = "メールアドレスが無効です";
        } else if (errorCode == "auth/user-disabled") {
          notice.textContent = "このアカウントは無効になっています";
        } else {
          notice.textContent = `その他のエラー: ${errorContent}`;
        }
      });
  };

  return (
    <div className="h-screen w-full">
      <div className="md:hidden"></div>
      <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Button
          variant={"ghost"}
          asChild
          className={cn("absolute right-4 top-4 md:right-8 md:top-8")}
        >
          <Link href="/register">アカウントの作成</Link>
        </Button>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Image
              src="/assets/icon.png"
              alt="logo"
              width={40}
              height={40}
              className="mr-2 rounded-full"
            />
            Deni AI
          </div>
          <div className="relative z-20 w-full mt-auto flex justify-between flex-wrap gap-2">
            <div className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-10px)] bg-secondary p-3 rounded-md">
              <div className="flex items-center gap-1">
                <Zap />
                <h3 className="text-lg font-bold">より高い制限</h3>
              </div>
              <p>50回の制限をサインインすることでなくすことができます。</p>
            </div>

            <div className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-10px)] bg-secondary p-3 rounded-md">
              <div className="flex items-center gap-1">
                <FlaskConical />
                <h3 className="text-lg font-bold">試験的モデル (+画像)</h3>
              </div>
              <p>試験的モデル(o3-mini など) を使用できるようになります。</p>
            </div>

            <div className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-10px)] bg-secondary p-3 rounded-md">
              <div className="flex items-center gap-1">
                <CloudUpload />
                <h3 className="text-lg font-bold">メッセージ履歴の同期</h3>
              </div>
              <p>他デバイスでもログインすれば同じメッセージ履歴を使えます。</p>
            </div>

            <div className="w-full md:w-[calc(50%-10px)] bg-secondary p-3 rounded-md">
              <div className="flex items-center gap-1">
                <Sparkle />
                <h3 className="text-lg font-bold">テスト中の機能</h3>
              </div>
              <p>
                WebContainer™ を使用した開発なども！？
              </p>
            </div>

            <div className="w-full md:w-[calc(50%-10px)] bg-secondary p-3 rounded-md">
              <div className="flex items-center gap-1">
                <MessageCircle />
                <h3 className="text-lg font-bold">Rai Chat</h3>
              </div>
              <p>(宣伝) チャットサービスの Rai Chat を利用できます！</p>
            </div>
          </div>

          <div className="relative z-20 mt-auto">
            <footer className="text-sm text-muted-foreground">
              *WebContainer は、StackBlitz®の商標または登録商標です。(開発機能は登場予定)<br />
              *すべてのモデルは、
              <Link href="https://voids.top/" target="_blank" className="font-bold hover:underline underline-offset-3">voids.top</Link>
              によって提供されています。
            </footer>
          </div>
        </div>

        <div className="m-auto h-screen flex flex-col justify-center space-y-6 w-full">
          <div className="mx-auto md:w-2/3 lg:w-1/2">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">ログイン</h1>
              <p className="text-sm text-muted-foreground">
                アカウント情報を入力して、ログインします。
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground" htmlFor="email">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 mb-2">
              <Label className="text-muted-foreground" htmlFor="password">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワード"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Label ref={noticeRef} className="text-red-500"></Label>
            <Button
              type="submit"
              className="w-full mb-2 mt-4"
              onClick={loginClicked}
            >
              ログイン
            </Button>

            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  次で続ける
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-center mb-4">
              <Button
                type="submit"
                className="w-full"
                onClick={() => signInWithGoogle()}
              >
                <SiGoogle /> Google でサインイン
              </Button>
              <Button
                type="submit"
                className="w-full"
                onClick={() => signInWithGitHub()}
              >
                <SiGithub /> GitHub でサインイン
              </Button>
            </div>
            <p className="px-2 text-center text-sm text-muted-foreground">
              このサイトにログインすると、
              <Link
                href="/infomation/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                利用規約
              </Link>{" "}
              と{" "}
              <Link
                href="/infomation/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                プライバシーポリシー
              </Link>{" "}
              に同意したことになります。
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={isDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>二段階認証が必要です</AlertDialogTitle>
            <AlertDialogDescription>
              このアカウントは、2段階認証による追加の保護が付与されています。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Label className="text-muted-foreground" htmlFor="twoFaCode">
            二段階認証のコード
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
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={closeDialog}>続行</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
