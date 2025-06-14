"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowUpRight,
  Edit,
  KeyboardIcon,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Header } from "@/components/header";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
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
        <div className="w-full lg:max-w-3/4 lg:my-8 mx-auto">
          {/* Hero Section */}
          <div className="w-full border">
            <div className="relative overflow-hidden bg-black border-b border-neutral-800 mb-5">
              <div className="absolute inset-0 bg-grid-small-white/[0.2] bg-grid-small-white/[0.2]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
              </div>
              <div className="flex items-center pt-24 animate-show flex-col w-full max-w-7xl m-auto px-6 lg:px-8 pb-24 relative z-10">
                <h1 className="px-1 text-center text-5xl font-bold tracking-tight pb-4 sm:text-6xl md:text-7xl md:px-0">
                  {t("title")}
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-center text-xl md:text-2xl text-neutral-400">
                  {t("subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-10">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 font-medium rounded-full"
                  >
                    <Link href="/login">
                      <span className="flex items-center">
                        <span>{t("startButton")}</span>
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 font-medium rounded-full border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                  >
                    <Link href="https://docs.deniai.app">Docs</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Gradient Hero Image */}
            <div className="w-full flex justify-center -mt-24 mb-10 relative z-10 px-6">
              <div className="w-full max-w-6xl">
                <div className="relative rounded-lg overflow-hidden border border-neutral-800 shadow-2xl bg-black">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
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
          </div>

          {/* Testimonials Section */}
          <div className="w-full border-b border-l border-r px-6 py-6 max-w-7xl mx-auto">
            <div className="mt-6">
              <Tabs defaultValue="one" className="w-full">
                <TabsContent value="one" className="mt-0">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                      className="md:max-w-1/2 w-full"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true }}
                    >
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
                    </motion.div>
                    <div className="w-full md:max-w-1/2">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="flex-1 relative w-full"
                      >
                        <div className="w-full relative bg-card rounded-xl overflow-hidden shadow-2xl border border-border/40">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
                          <div className="p-6 sm:p-8">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <h4 className="text-xl font-semibold">
                                    AI Costs
                                  </h4>
                                </div>
                              </div>

                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      AI Application
                                    </span>
                                    <span className="text-sm font-bold">
                                      $20 → $0
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary rounded-full"
                                      initial={{ width: "5%" }}
                                      whileInView={{ width: "100%" }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      AI API
                                    </span>
                                    <span className="text-sm font-bold">
                                      50% cheaper
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-chart-1 rounded-full"
                                      initial={{ width: "5%" }}
                                      whileInView={{ width: "50%" }}
                                      transition={{ duration: 1, delay: 0.7 }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/5 rounded-full blur-xl" />
                        <div className="absolute -top-6 -left-6 h-24 w-24 bg-chart-1/5 rounded-full blur-xl" />
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>
                {/* Other tabs would have similar content */}
                <TabsContent value="two" className="mt-0">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                      className="md:max-w-1/2 w-full"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true }}
                    >
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
                    </motion.div>
                    <div className="md:max-w-1/2 w-full">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="flex-1 relative"
                      >
                        <div className="relative bg-card rounded-xl overflow-hidden shadow-2xl border border-border/40">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
                          <div className="p-6 sm:p-8">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <h4 className="text-xl font-semibold">
                                    Users
                                  </h4>
                                </div>
                              </div>

                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      User count
                                    </span>
                                    <span className="text-sm font-bold">
                                      7.8k
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary rounded-full"
                                      initial={{ width: "5%" }}
                                      whileInView={{ width: "78%" }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      Used data to train
                                    </span>
                                    <span className="text-sm font-bold">
                                      not used
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-chart-1 rounded-full"
                                      initial={{ width: "0%" }}
                                      whileInView={{ width: "0%" }}
                                      transition={{ duration: 1, delay: 0.7 }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/5 rounded-full blur-xl" />
                        <div className="absolute -top-6 -left-6 h-24 w-24 bg-chart-1/5 rounded-full blur-xl" />
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="three" className="mt-0">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <motion.div
                      className="md:max-w-1/2 w-full"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true }}
                    >
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
                    </motion.div>
                    <div className="md:max-w-1/2 w-full">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="flex-1 relative"
                      >
                        <div className="relative bg-card rounded-xl overflow-hidden shadow-2xl border border-border/40">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
                          <div className="p-6 sm:p-8">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <h4 className="text-xl font-semibold">
                                    Uptime
                                  </h4>
                                </div>
                              </div>

                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      Deni AI (deniai.app)
                                    </span>
                                    <span className="text-sm font-bold">
                                      99.9% uptime
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary rounded-full"
                                      initial={{ width: "5%" }}
                                      whileInView={{ width: "99.9%" }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      Deni AI Docs (docs.deniai.app)
                                    </span>
                                    <span className="text-sm font-bold">
                                      99.9% uptime
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary rounded-full"
                                      initial={{ width: "5%" }}
                                      whileInView={{ width: "99.9%" }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/5 rounded-full blur-xl" />
                        <div className="absolute -top-6 -left-6 h-24 w-24 bg-chart-1/5 rounded-full blur-xl" />
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>
                <TabsList className="mb-8 mt-4">
                  <TabsTrigger value="one">
                    {t("features.oneTitle")}
                  </TabsTrigger>
                  <TabsTrigger value="two">
                    {t("features.twoTitle")}
                  </TabsTrigger>
                  <TabsTrigger value="three">
                    {t("features.threeTitle")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Features Grid Section */}
          <div className="w-full h-full flex flex-col gap-4 border-b border-l border-r">
            <div className="max-w-7xl h-full mx-auto border-b mb-4 px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex flex-col border-r">
                <div className="mt-8 mb-6 mr-2">
                  <div className="flex items-center my-4">
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
              </div>

              <div className="flex flex-col">
                <div className="mt-8 mr-2">
                  <div className="flex items-center my-4">
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
                        Added <Badge variant="outline">custom theme</Badge>{" "}
                        options to the chat interface
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
            </div>

            {/* Analytics Section */}
            <div className="max-w-7xl mx-auto px-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex flex-col border-r">
                <div className="mr-2">
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

                  <div className="border border-border/40 rounded-lg p-4 bg-card/50 mt-auto h-64 relative flex flex-col justify-around">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">
                          Access Count
                        </span>
                        <span className="text-sm font-semibold">7.8K</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: "78%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">
                          Uptime
                        </span>
                        <span className="text-sm font-semibold">99.9%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: "99.9%" }}
                        ></div>
                      </div>
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

                <div className="border border-border/40 rounded-lg p-4 bg-card/50 mt-auto h-64 relative flex flex-col justify-around">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex-1 relative"
                  >
                    <div className="relative bg-card rounded-xl overflow-hidden shadow-2xl border border-border/40">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
                      <div className="p-6 sm:p-8">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <h4 className="text-xl font-semibold">Users</h4>
                            </div>
                          </div>

                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  User count
                                </span>
                                <span className="text-sm font-bold">7.8k</span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary rounded-full"
                                  initial={{ width: "5%" }}
                                  whileInView={{ width: "78%" }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                  viewport={{ once: true }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  Used data to train
                                </span>
                                <span className="text-sm font-bold">
                                  not used
                                </span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-chart-1 rounded-full"
                                  initial={{ width: "0%" }}
                                  whileInView={{ width: "0%" }}
                                  transition={{ duration: 1, delay: 0.7 }}
                                  viewport={{ once: true }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/5 rounded-full blur-xl" />
                    <div className="absolute -top-6 -left-6 h-24 w-24 bg-chart-1/5 rounded-full blur-xl" />
                  </motion.div>
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
                    <Link href="/">{t("startButton")}</Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatApp;
