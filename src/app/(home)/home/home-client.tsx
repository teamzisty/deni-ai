"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, BookOpenText, BrainCircuit, Code, PencilLine, Zap } from "lucide-react";
import { useExtracted } from "next-intl";
import { SiAnthropic, SiGoogle, SiX } from "@icons-pack/react-simple-icons";
import { LoginButton } from "@/components/login-button";
import { BlurReveal } from "@/components/blur-reveal";
import { HighlightedText } from "@/components/highlighted-text";
import { LogosCarousel } from "@/components/logos-carousel";
import { Button } from "@/components/ui/button";
import AnimatedGradient from "@/components/animated-gradient";
import Openai from "@/components/openai";

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative p-6 rounded-2xl border border-border bg-card/20 backdrop-blur-sm transition-all hover:bg-card hover:shadow-xl hover:-translate-y-1"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary text-foreground mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export function ClientHome() {
  const t = useExtracted();

  const quickUses = [
    {
      icon: BrainCircuit,
      title: t("Ask and compare"),
      description: t(
        "Try the same question with different models when you want a clearer answer or a second opinion.",
      ),
    },
    {
      icon: PencilLine,
      title: t("Write a little faster"),
      description: t(
        "Draft messages, notes, captions, and small pieces of writing without getting stuck on the first version.",
      ),
    },
    {
      icon: BookOpenText,
      title: t("Study or explore"),
      description: t(
        "Break down topics, summarize what you are reading, and keep learning moving when you want help thinking something through.",
      ),
    },
  ];

  const modelTips = [
    {
      title: t("Start with something fast"),
      description: t("If you just want a quick answer or rough draft, that is usually enough."),
    },
    {
      title: t("Switch when you want more depth"),
      description: t(
        "If the first answer feels thin, move to a stronger model for better reasoning or explanation.",
      ),
    },
    {
      title: t("Use coding models for code"),
      description: t(
        "When the task is implementation, debugging, or refactoring, pick a model made for that kind of work.",
      ),
    },
  ];

  const aiLogos = [
    <Openai key="openai" className="size-8 opacity-40 hover:opacity-100 transition-opacity" />,
    <SiGoogle key="google" className="size-8 opacity-40 hover:opacity-100 transition-opacity" />,
    <SiAnthropic
      key="anthropic"
      className="size-8 opacity-40 hover:opacity-100 transition-opacity"
    />,
    <Openai key="openai2" className="size-8 opacity-40 hover:opacity-100 transition-opacity" />,
    <SiX key="xai" className="size-8 opacity-40 hover:opacity-100 transition-opacity" />,
    <SiGoogle key="google2" className="size-8 opacity-40 hover:opacity-100 transition-opacity" />,
  ];

  return (
    <main className="relative min-h-screen overflow-hidden" id="main-content">
      {/* Background Animated Gradient */}
      <AnimatedGradient
        config={{ preset: "Plasma", speed: 15 }}
        noise={{ opacity: 0.05 }}
        className="opacity-40"
      />

      {/* Hero Section */}
      <section className="min-h-[100vh] relative px-4 pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            {/* Main headline */}
            <h1
              data-nosnippet
              className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[1.02] mb-8"
            >
              <BlurReveal className="block" delay={0.2}>
                {t("The AI Assistant")}
              </BlurReveal>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="block mt-4"
              >
                <HighlightedText from="left" delay={1.2} className="px-4 py-1">
                  {t("You Deserve")}
                </HighlightedText>
              </motion.span>
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="max-w-2xl text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 font-medium"
            >
              {t(
                "Access the latest AI models without breaking the bank. Deni AI brings premium intelligence to everyone, completely free.",
              )}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.8 }}
              className="flex flex-col items-center gap-5"
            >
              <LoginButton />
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                <Link href="/models" className="transition-colors hover:text-foreground">
                  {t("Browse models")}
                </Link>
                <span aria-hidden="true">/</span>
                <Link href="/use-cases" className="transition-colors hover:text-foreground">
                  {t("See use cases")}
                </Link>
              </div>
            </motion.div>

            {/* Logo Carousel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="flex flex-col items-center mt-24 w-full"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-10">
                {t("Powered by the world's best models")}
              </p>

              <LogosCarousel count={3} interval={3000} className="w-full items-center">
                {aiLogos.map((logo, i) => (
                  <React.Fragment key={i}>{logo}</React.Fragment>
                ))}
              </LogosCarousel>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 py-24 md:py-32 bg-secondary/20 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              {t("A few things you can do with Deni AI")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-xl max-w-2xl mx-auto"
            >
              {t(
                "Pick the model that fits the moment, whether you want a quick answer, help writing, or a second opinion while you work.",
              )}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {quickUses.map((item, index) => (
              <FeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                delay={0.3 + index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("Picking a model")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight">
              {t("You can keep this part simple")}
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {t(
                "You do not need to memorize every model name. Start with something quick, then switch when you want a better answer, more reasoning, or help with code.",
              )}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {modelTips.map((tip, index) => (
              <div
                key={tip.title}
                className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold">
                  {index === 0 ? <Zap /> : index === 1 ? <BrainCircuit /> : <Code />}
                </div>
                <h3 className="text-lg font-semibold">{tip.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/40 bg-background/80 px-4 py-24 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("Start wherever feels easy")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight">
              {t("You do not need a big setup")}
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {t(
                "If you just want to look around first, these are the two easiest places to start.",
              )}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Link
              href="/models"
              className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
            >
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="mt-5 text-xl font-semibold">{t("See the models")}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {t(
                  "Take a quick look at what is available and pick one that feels right for the moment.",
                )}
              </p>
            </Link>
            <Link
              href="/use-cases"
              className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
            >
              <BookOpenText className="h-5 w-5 text-primary" />
              <h3 className="mt-5 text-xl font-semibold">{t("See how people use it")}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {t(
                  "Get a feel for the small everyday ways Deni AI can help with writing, studying, and thinking things through.",
                )}
              </p>
            </Link>
          </div>

          <div className="mt-10 flex justify-start">
            <Button variant="outline" asChild>
              <Link href="/models">
                {t("Open the model list")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          <Link
            href="/use-cases"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <BookOpenText className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Read a few examples")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("See a few simple examples of how Deni AI can help with everyday personal use.")}
            </p>
          </Link>
          <Link
            href="/chat"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Jump into chat")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("If you already know what you want to ask, you can open chat and start there.")}
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
