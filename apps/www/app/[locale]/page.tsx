"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CircleDollarSign, LockIcon, MessageSquare } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Header } from "@/components/header";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  SiClaude,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";

const ChatApp: React.FC = () => {
  const [currentModel, setCurrentModel] = useState(0);
  const t = useTranslations("landing");
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
            {t("title")}
          </h1>{" "}
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg md:text-xl text-muted-foreground">
            {t("subtitle")}
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
              {t("featuresTitle")}
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("featuresHeading")}
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t("featuresSubtitle")}
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
                  <CardTitle className="mt-2">{t("freeTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {t("freeDescription")}
                </CardContent>
              </Card>
              {/* Feature 2 - Right */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-pink-700/90 w-fit">
                    <LockIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">{t("privacyTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {t("privacyDescription")}
                </CardContent>
              </Card>
              {/* Feature 3 - Center */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-yellow-600/90 w-fit">
                    <LockIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">{t("speedTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {t("speedDescription")}
                </CardContent>
              </Card>
              {/* Feature 4 */}
              <Card className="bg-muted/50 p-4">
                <CardHeader className="pb-2">
                  <div className="rounded-md p-2 bg-amber-700/90 w-fit">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-2">{t("supportTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {t("supportDescription")}
                </CardContent>
              </Card>{" "}
            </dl>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("compatibilityTitle")}
            </h2>
          </div>
          <div className="mx-auto border p-4 mt-8 flex gap-2 justify-between items-center">
            <div className="rounded-md w-full">
              <h1 className="text-3xl font-bold">
                {t("yourModel")}{" "}
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
                {t("compatible")}
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
          <h1 className="text-5xl font-bold">{t("startNow")}</h1>
          <Button asChild size="lg">
            <Link href="/home">{t("startButton")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default ChatApp;
