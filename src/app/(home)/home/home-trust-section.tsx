"use client";

import Link from "next/link";
import { BookOpenText, BrainCircuit, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { useExtracted } from "next-intl";

export function HomeTrustSection() {
  const t = useExtracted();

  const trustSignals = [
    {
      icon: ShieldCheck,
      title: t("Private by design"),
      description: t(
        "Your conversations are treated as your workspace content. We do not use chats to train our own models, and account controls are available inside the app.",
      ),
    },
    {
      icon: KeyRound,
      title: t("Bring your own keys"),
      description: t(
        "People who already pay providers directly can connect their own API keys and keep usage separate from Deni AI limits.",
      ),
    },
    {
      icon: CheckCircle2,
      title: t("Transparent limits"),
      description: t(
        "The product explains usage limits and model cost differences so visitors can understand what changes between free and paid access.",
      ),
    },
  ];

  return (
    <>
      <section className="relative px-4 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("Trust and access")}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Useful AI should be understandable before you sign in")}
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              {t(
                "Visitors can read what the product does, review the available model families, check legal policies, and understand privacy expectations before opening the chat workspace.",
              )}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {trustSignals.map((signal) => (
              <article
                key={signal.title}
                className="rounded-[1.5rem] border border-border/70 bg-card p-6"
              >
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-2xl bg-secondary">
                  <signal.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{signal.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{signal.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          <Link
            href="/use-cases"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <BookOpenText className="size-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Read a few examples")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("See a few simple examples of how Deni AI can help with everyday personal use.")}
            </p>
          </Link>
          <Link
            href="/chat"
            className="rounded-[1.5rem] border border-border/70 bg-card p-6 transition-transform hover:-translate-y-1"
          >
            <BrainCircuit className="size-5 text-primary" />
            <h3 className="mt-5 text-xl font-semibold">{t("Jump into chat")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("If you already know what you want to ask, you can open chat and start there.")}
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
