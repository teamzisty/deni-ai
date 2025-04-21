"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowUpRight,
  CircleDollarSign,
  DollarSignIcon,
  Edit,
  EyeOff,
  GitCommit,
  GitPullRequest,
  InfinityIcon,
  Keyboard,
  KeyboardIcon,
  LockIcon,
  MessageSquare,
  ServerIcon,
  Shield,
  ShieldCheck,
  ShieldCheckIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Header } from "@/components/header";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@workspace/ui/components/card";
import {
  SiClaude,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import { useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

const ChatApp: React.FC = () => {
  const t = useTranslations("landing");

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      <Header />
      <div className={cn("w-full")}>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-background border-b border-border/40">
          <div className="flex items-center pt-20 animate-show flex-col w-full max-w-7xl m-auto px-6 lg:px-8 pb-24">
            <h1 className="px-1 text-center text-5xl font-bold tracking-tight pb-4 sm:text-6xl md:text-7xl md:px-0">
              {t("title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xl md:text-2xl text-muted-foreground">
              {t("subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Button asChild size="lg" className="h-12 px-8 font-medium">
                <Link href="/home">
                  <span className="flex items-center">
                    <span>{t("startButton")}</span>
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 font-medium"
              >
                <Link href="https://ai-docs.raic.dev">Docs</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Gradient Hero Image */}
        <div className="w-full flex justify-center -mt-16 relative z-10 px-6">
          <div className="w-full max-w-6xl">
            <div className="relative rounded-lg overflow-hidden border border-border/40 shadow-2xl">
              <Image
                alt="Hero"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                src="/assets/hero.png"
                unoptimized={true}
              />
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="w-full px-6 py-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="text-primary">{t("features.oneTitle")}</span>
                <br /> {t("features.oneSubtitle")}
              </h2>
            </div>
            <div className="md:col-span-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="text-primary">{t("features.twoTitle")}</span>
                <br /> {t("features.twoSubtitle")}
              </h2>
            </div>
            <div className="md:col-span-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="text-primary">{t("features.threeTitle")}</span>
                <br /> {t("features.threeSubtitle")}
              </h2>
            </div>
          </div>

          <div className="mt-12">
            <Tabs defaultValue="one" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="one">{t("features.oneTitle")}</TabsTrigger>
                <TabsTrigger value="two">{t("features.twoTitle")}</TabsTrigger>
                <TabsTrigger value="three">
                  {t("features.threeTitle")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="one" className="mt-0">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="md:w-1/2">
                    <h3 className="text-2xl font-bold mb-4">
                      {t("featuresTab.one.title")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("featuresTab.one.subtitle")}
                    </p>
                    <Button asChild size="lg" className="rounded-full">
                      <Link href="/compare">
                        <span className="flex items-center">
                          {t("featuresTab.one.button")}
                          <span className="ml-2 text-lg">↗</span>
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <div className="md:w-1/2">
                    <div className="h-[300px] w-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-border/40">
                      <div className="text-center p-6">
                        <DollarSignIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h4 className="text-xl font-bold mb-2">
                          {t("featuresTab.one.heroTitle")}
                        </h4>
                        <p className="text-muted-foreground">
                          {t("featuresTab.one.heroDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              {/* Other tabs would have similar content */}
              <TabsContent value="two" className="mt-0">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="md:w-1/2">
                    <h3 className="text-2xl font-bold mb-4">
                      {t("featuresTab.two.title")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("featuresTab.two.subtitle")}
                    </p>
                    <Button asChild size="lg" className="rounded-full">
                      <Link href="/privacy-policy">
                        <span className="flex items-center">
                          {t("featuresTab.two.button")}
                          <span className="ml-2 text-lg">↗</span>
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <div className="md:w-1/2">
                    <div className="h-[300px] w-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-border/40">
                      <div className="text-center p-6">
                        <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h4 className="text-xl font-bold mb-2">
                          {t("featuresTab.two.title")}
                        </h4>
                        <p className="text-muted-foreground">
                          {t("featuresTab.two.heroDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="three" className="mt-0">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="md:w-1/2">
                    <h3 className="text-2xl font-bold mb-4">
                      {t("featuresTab.three.title")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("featuresTab.three.subtitle")}
                    </p>
                    <Button asChild size="lg" className="rounded-full">
                      <Link href="/compare">
                        <span className="flex items-center">
                          {t("featuresTab.three.button")}
                          <span className="ml-2 text-lg">↗</span>
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <div className="md:w-1/2">
                    <div className="h-[300px] w-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-border/40">
                      <div className="text-center p-6">
                        <ServerIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h4 className="text-xl font-bold mb-2">
                          {t("featuresTab.three.title")}
                        </h4>
                        <p className="text-muted-foreground">
                          {t("featuresTab.three.heroDescription", {
                            provider: "Vercel",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Features Grid Section */}
        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <KeyboardIcon className="mr-2 h-5 w-5" />
              <h3 className="text-xl font-semibold">
                {t("characteristics.one.badge")}
              </h3>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {t("characteristics.one.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              {t("characteristics.one.description")}
            </p>

            <div className="bg-black rounded-lg p-4 mt-auto">
              <pre className="text-sm text-white/90 font-mono overflow-x-auto">
                <code>{`~/ai-app> deniai -p Create AI Chat Application (cool)
Okay, I create a chat application for you.

- Tech Stack: Next.js, Tailwind CSS, shadcn/ui, Lucide

~ ai-app/app/layout.tsx
> Deni AI Editing Your file
                
Generating code...`}</code>
              </pre>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <Edit className="mr-2 h-5 w-5" />
              <h3 className="text-xl font-semibold">
                {t("characteristics.two.badge")}
              </h3>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {t("characteristics.two.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              {t("characteristics.two.description")}
            </p>

            <div className="border border-border/40 rounded-lg p-4 bg-card/50 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">
                  Added <Badge variant="outline">custom theme</Badge> options to
                  the chat interface
                </span>
                <Badge className="bg-blue-500">User</Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">
                  I've created a custom prompt template for my team
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Just deployed my customized AI assistant to our company
                  portal!
                </span>
                <Badge className="bg-green-500">Admin</Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm">
                  Love how easy it is to personalize everything!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <Sparkles className="mr-2 h-5 w-5" />
              <h3 className="text-xl font-semibold">
                {t("characteristics.three.badge")}
              </h3>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {t("characteristics.three.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              {t("characteristics.three.description")}
            </p>

            <div className="bg-black rounded-lg p-4 mt-auto h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-48">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center mb-4">
                        <Zap className="h-8 w-8 text-yellow-400 mr-2" />
                        <span className="text-white font-bold text-xl">
                          Fast
                        </span>
                      </div>
                      <div className="flex items-center mb-4">
                        <Shield className="h-8 w-8 text-green-400 mr-2" />
                        <span className="text-white font-bold text-xl">
                          Reliable
                        </span>
                      </div>
                      <div className="flex items-center">
                        <InfinityIcon className="h-8 w-8 text-blue-400 mr-2" />
                        <span className="text-white font-bold text-xl">
                          Unlimited
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-4 flex flex-col">
                <div className="flex items-center mb-2">
                  <span className="text-white text-sm mr-2">Response time</span>
                  <span className="text-white font-bold">0.8s</span>
                  <span className="text-green-500 text-xs ml-2">-30%</span>
                </div>
                <div className="flex items-center">
                  <span className="text-white text-sm mr-2">Uptime</span>
                  <span className="text-white font-bold">99.9%</span>
                  <span className="text-green-500 text-xs ml-2">+0.5%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <Shield className="mr-2 h-5 w-5" />
              <h3 className="text-xl font-semibold">
                {t("characteristics.four.badge")}
              </h3>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {t("characteristics.four.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              {t("characteristics.four.description")}
            </p>

            <div className="border border-border/40 rounded-lg p-4 bg-card/50 mt-auto h-64 relative">
              <div className="absolute top-4 left-4">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Privacy-Shield/v2.0.1</span>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm">End-to-end encryption enabled</span>
                  <Badge className="ml-2 bg-emerald-500/90">Secure</Badge>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-4">
                    <LockIcon className="h-8 w-8 text-green-400 mr-2" />
                    <span className="font-bold text-xl">Data Protected</span>
                  </div>
                  <div className="flex items-center mb-4">
                    <EyeOff className="h-8 w-8 text-blue-400 mr-2" />
                    <span className="font-bold text-xl">Privacy First</span>
                  </div>
                  <div className="flex items-center">
                    <ShieldCheck className="h-8 w-8 text-purple-400 mr-2" />
                    <span className="font-bold text-xl">No Data Selling</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4">
                <div className="relative w-32 h-32 bg-card/30 rounded-md border border-border/40 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="h-16 w-16 text-green-400/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="w-full py-24 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer 15s ease-in-out infinite",
            }}
          />
          <style jsx global>{`
            @keyframes shimmer {
              0% {
                background-position: 0% 0;
              }
              50% {
                background-position: 100% 0;
              }
              100% {
                background-position: 0% 0;
              }
            }
          `}</style>
          <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row gap-8 md:gap-0 items-center justify-between rounded-sm relative z-10">
            <motion.h1
              className="text-4xl sm:text-5xl font-bold text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {t("startNow")}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button asChild size="lg" className="h-12 px-8 font-medium">
                <Link href="/home">{t("startButton")}</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatApp;
