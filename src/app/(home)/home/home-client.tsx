"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Zap, Shield, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { SiAnthropic, SiGoogle, SiX } from "@icons-pack/react-simple-icons";
import { LoginButton } from "@/components/login-button";
import { AdSenseSlot } from "@/components/adsense-slot";
import { Button } from "@/components/ui/button";
import { BlurReveal } from "@/components/blur-reveal";
import { HighlightedText } from "@/components/highlighted-text";
import { LogosCarousel } from "@/components/logos-carousel";
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
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[1.02] mb-8">
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
              className="flex flex-col sm:flex-row gap-5"
            >
              <LoginButton />
              <Button
                variant="outline"
                size="lg"
                asChild
                className="group hover:bg-secondary transition-all"
              >
                <Link href="#features">
                  {t("Learn More")}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
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

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.7 }}
              className="mt-14 w-full max-w-3xl"
            >
              <AdSenseSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT_ID ?? ""} />
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

      {/* CTA Section */}
      <section className="relative px-4 py-32 md:py-48">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-[2.5rem] border-2 border-border bg-card/50 backdrop-blur-sm p-12 md:p-24 text-center shadow-2xl"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),transparent)]" />
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight mb-6">
              {t("Ready to Get Started?")}
            </h2>
            <p className="text-muted-foreground mb-12 max-w-lg mx-auto text-xl leading-relaxed">
              {t(
                "Join thousands of users who are already experiencing the future of AI assistance.",
              )}
            </p>
            <div className="flex justify-center scale-110">
              <LoginButton />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
