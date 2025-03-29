"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CircleDollarSign, LockIcon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import Image from "next/image";
import { Link } from 'next-view-transitions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SiClaude,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";

const ChatApp: React.FC = () => {
  const [currentModel, setCurrentModel] = useState(0);
  const models = ["ChatGPT", "Claude", "Grok"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModel((prev) => (prev + 1) % models.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [models.length]);

  return (
    <main>
      <Header />
      <div className={cn("w-full")}>
        <br />

        {/* Input Area */}
        <div className="flex items-center pt-20 animate-show flex-col w-full md:w-7/12 m-auto">
          <h1 className="px-1 text-center text-5xl font-medium pb-1 sm:text-6xl md:px-0">
            無料の代替チャットサービス
          </h1>{" "}
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg md:text-xl text-muted-foreground">
            すべての人のために作られた、無制限・完全無料で安全な AI
            チャットサービス
          </p>
          <div className="mx-auto mt-8 w-full max-w-5xl overflow-hidden animate-up px-4">
            <div className="relative items-center justify-center rounded-xl border border-muted bg-[#b4b2b21a] p-1 shadow-xl shadow-black backdrop-blur-lg md:flex md:animate-move-up md:p-5">
              <Image
                alt="ヒーロー"
                width="800"
                height="600"
                className="h-full w-full rounded-xl shadow-sm md:rounded-lg"
                src="/assets/hero.png"
                unoptimized={true}
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl  lg:text-center">
            <h2 className="text-base font-bold leading-7 text-muted-foreground">
              主な特徴
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              より良いAIチャット体験を
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              高度な機能と使いやすさを兼ね備えた、次世代のAIチャットサービス
            </p>
          </div>

          <div className="mx-auto mt-8 mb-5 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:max-w-none lg:grid-cols-4">
              {/* Feature 1 - Left */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-green-700/90 w-fit">
                    <CircleDollarSign className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">完全無料</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  サブスクリプションや隠れた料金は一切なし。すべての機能を無料で利用可能。
                </CardContent>
              </Card>
              {/* Feature 2 - Right */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-pink-700/90 w-fit">
                    <LockIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">プライバシーに配慮</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  データのセキュリティとプライバシーを尊重し、ユーザーのデータを保護します。
                </CardContent>
              </Card>
              {/* Feature 3 - Center */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-yellow-600/90 w-fit">
                    <LockIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">高速なレスポンス</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  最新のテクノロジーを活用し、ユーザーに高速なレスポンスを提供します。
                </CardContent>
              </Card>
              {/* Feature 4 */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-amber-700/90 w-fit">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">サポート</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  サポートの時間内なら、AIについてのサポートをご利用いただけます。
                </CardContent>
              </Card>{" "}
            </dl>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              主要なAIモデルとの互換性
            </h2>
          </div>
          <div className="mx-auto border p-4 mt-8 flex gap-2 justify-between items-center">
            <div className="rounded-md w-full">
              <h1 className="text-3xl font-bold">
                あなたの{" "}
                <motion.span
                  key={currentModel}
                  className="text-muted-foreground inline-block mr-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.5,
                  }}
                >
                  {models[currentModel]}
                </motion.span>
                互換
              </h1>
            </div>

            <div className="rounded-md flex px-5 items-center justify-center">
              <div className="border font-bold text-lg p-14">
                <SiOpenai size="48" />
              </div>
              <div className="border font-bold text-lg p-14">
                <SiClaude size="48" />
              </div>
              <div className="border font-bold text-lg p-14">
                <SiX size="48" />
              </div>
              <div className="border font-bold text-lg p-14">
                <SiGooglegemini size="48" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto bg-muted/50 mt-32 max-w-7xl mb-16 p-16 flex justify-between rounded-sm">
          <h1 className="text-5xl font-bold">今すぐ始める</h1>
          <Button asChild size="lg">
            <Link href="/home">始める</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default ChatApp;
