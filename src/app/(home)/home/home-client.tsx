"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CircleHelp,
  FileSearch,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useExtracted } from "next-intl";
import { SiAnthropic, SiGoogle, SiX } from "@icons-pack/react-simple-icons";
import { LoginButton } from "@/components/login-button";
import { BlurReveal } from "@/components/blur-reveal";
import { HighlightedText } from "@/components/highlighted-text";
import { LogosCarousel } from "@/components/logos-carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  const valuePoints = [
    {
      icon: Sparkles,
      title: t("One place for leading AI models"),
      description: t(
        "Switch between GPT, Claude, Gemini, and other models without changing apps or managing separate tabs.",
      ),
    },
    {
      icon: FileSearch,
      title: t("Model choice with context"),
      description: t(
        "Use the faster models for quick drafts, reasoning models for harder tasks, and coding models when you need implementation help.",
      ),
    },
    {
      icon: Users,
      title: t("Built for daily work"),
      description: t(
        "Deni AI is designed for research, writing, coding, translation, planning, and team workflows rather than one-off demos.",
      ),
    },
  ];

  const workflows = [
    {
      title: t("Research and summarization"),
      description: t(
        "Compare explanations, summarize long notes, and turn rough questions into clear next steps when you need a second brain for everyday work.",
      ),
    },
    {
      title: t("Coding and debugging"),
      description: t(
        "Use stronger reasoning and coding models to review errors, generate implementation plans, and iterate on production code faster.",
      ),
    },
    {
      title: t("Writing and translation"),
      description: t(
        "Draft emails, improve copy, translate between languages, and adjust tone without moving between multiple tools.",
      ),
    },
    {
      title: t("Team handoff and reuse"),
      description: t(
        "Share outputs, keep model access in one workspace, and reduce the friction of everyone using different AI subscriptions.",
      ),
    },
  ];

  const comparisonRows = [
    {
      situation: t("Quick answers and lightweight tasks"),
      recommendation: t("Start with fast general models"),
      reason: t("They respond quickly and keep simple tasks inexpensive and easy to iterate."),
    },
    {
      situation: t("Hard reasoning or planning"),
      recommendation: t("Use reasoning-focused models"),
      reason: t(
        "They perform better when tasks involve tradeoffs, logic, or longer chains of thought.",
      ),
    },
    {
      situation: t("Implementation and refactoring"),
      recommendation: t("Use coding-oriented models"),
      reason: t(
        "They are tuned for code generation, debugging, and repository-level changes rather than general chat alone.",
      ),
    },
    {
      situation: t("Comparing answers before acting"),
      recommendation: t("Check more than one model"),
      reason: t(
        "Different providers have different strengths, so comparison helps reduce blind spots on important tasks.",
      ),
    },
  ];

  const faqs = [
    {
      question: t("What makes Deni AI different from a single-model chat app?"),
      answer: t(
        "Deni AI is built around comparison and flexibility. Instead of committing to one provider, you can choose the model that fits the task, which is useful when speed, reasoning quality, price, and output style all matter.",
      ),
    },
    {
      question: t("Who is this product for?"),
      answer: t(
        "The product is aimed at people who use AI repeatedly in real workflows: developers, solo founders, students, operators, marketers, and teams who need more than a novelty chat box.",
      ),
    },
    {
      question: t("Can I understand which model to use without prior experience?"),
      answer: t(
        "Yes. The public pages explain the role of each model family, and the app is designed so you can start with a general model and switch when you need stronger reasoning, faster responses, or coding help.",
      ),
    },
    {
      question: t("Is Deni AI only useful after signup?"),
      answer: t(
        "No. The public site explains what the product does, who it helps, how model selection works, and where to find supporting legal and company information before you create an account.",
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
                <span aria-hidden="true">/</span>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  {t("Learn about Deni AI")}
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
              {t("Why Choose Deni AI?")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-xl max-w-2xl mx-auto"
            >
              {t("Built for everyone who wants access to cutting-edge AI technology.")}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={BrainCircuit}
              title={t("Latest Models")}
              description={t(
                "Access GPT-5, Claude, Gemini, and more. Always up-to-date with the newest AI capabilities.",
              )}
              delay={0.3}
            />
            <FeatureCard
              icon={Zap}
              title={t("Lightning Fast")}
              description={t(
                "Optimized infrastructure for instant responses. No waiting, just pure speed.",
              )}
              delay={0.4}
            />
            <FeatureCard
              icon={Shield}
              title={t("Private & Secure")}
              description={t(
                "Your conversations stay yours. Enterprise-grade security without the enterprise price.",
              )}
              delay={0.5}
            />
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {t("Why this site exists")}
              </p>
              <h2 className="text-4xl font-bold tracking-tight">
                {t("A practical guide to using AI well, not just a place to open a chat box")}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
                {t(
                  "Most AI products ask users to commit to one provider before they understand the tradeoffs. Deni AI is meant to reduce that friction. The public site explains what the product is for, how model selection works, and where the service fits into real workflows so visitors can decide whether the app is useful before they sign up.",
                )}
              </p>
            </div>
            <div className="grid gap-4">
              {valuePoints.map(({ icon, title, description }) => {
                const Icon = icon;

                return (
                  <div
                    key={title}
                    className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 backdrop-blur-sm"
                  >
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/40 bg-background/80 px-4 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("Typical workflows")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight">
              {t("What people can actually do with Deni AI")}
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {t(
                "This product is most useful when a person needs a reliable place to move between models during normal work. These are common patterns the site is built around.",
              )}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {workflows.map((workflow, index) => (
              <div
                key={workflow.title}
                className="rounded-[1.5rem] border border-border/70 bg-card p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{workflow.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {workflow.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {t("Model selection")}
              </p>
              <h2 className="text-4xl font-bold tracking-tight">
                {t("How to choose a model without guessing")}
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                {t(
                  "A large part of the product value is helping people understand when they should prioritize speed, reasoning depth, or coding ability. This summary mirrors how the app is intended to be used.",
                )}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/models">
                {t("Open the full model list")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card">
            <div className="grid border-b border-border/60 bg-secondary/30 px-5 py-4 text-sm font-semibold text-foreground/80 md:grid-cols-[1fr_1fr_1.2fr]">
              <span>{t("Situation")}</span>
              <span>{t("Recommended approach")}</span>
              <span>{t("Why it helps")}</span>
            </div>
            {comparisonRows.map((row) => (
              <div
                key={row.situation}
                className="grid gap-2 border-b border-border/50 px-5 py-5 text-sm last:border-b-0 md:grid-cols-[1fr_1fr_1.2fr] md:gap-6"
              >
                <p className="font-medium">{row.situation}</p>
                <p className="text-foreground/85">{row.recommendation}</p>
                <p className="leading-7 text-muted-foreground">{row.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-secondary/20 px-4 py-24 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("Questions people ask")}
            </p>
            <h2 className="text-4xl font-bold tracking-tight">{t("Frequently asked questions")}</h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {t(
                "These answers are here so visitors can understand the product before creating an account, rather than being pushed straight into the app.",
              )}
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-10 rounded-[1.75rem] border border-border/70 bg-card px-6"
          >
            {faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="py-5 text-left text-base font-semibold">
                  <span className="inline-flex items-center gap-3">
                    <CircleHelp className="h-4 w-4 text-primary" />
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <Link
            href="/use-cases"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <BookOpenText className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Read practical use cases")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(
                "See concrete examples of where Deni AI helps and how different model families fit different jobs.",
              )}
            </p>
          </Link>
          <Link
            href="/about"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <Users className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Review company background")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(
                "Understand the product mission, operating principles, and the type of experience the team is trying to build.",
              )}
            </p>
          </Link>
          <Link
            href="/legal/privacy-policy"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Check privacy information")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(
                "Privacy, terms, and commerce disclosures are available publicly so users can evaluate the service before signup.",
              )}
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
