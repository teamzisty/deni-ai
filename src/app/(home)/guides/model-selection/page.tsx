import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gauge, GitCompare, ShieldAlert } from "lucide-react";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("How to choose an AI model for real work");
  const description = t(
    "A practical model selection guide for choosing fast, reasoning, coding, and writing-focused AI models based on the task.",
  );

  return {
    title,
    description,
    alternates: {
      canonical: "https://deniai.app/guides/model-selection",
    },
    openGraph: {
      title: `${title} — Deni AI Guides`,
      description,
    },
  };
}

export default function ModelSelectionGuidePage() {
  const t = useExtracted();
  const headline = t("How to choose an AI model for real work");
  const description = t(
    "Most people choose AI models by reputation. A better method is to start from the task, decide the risk level, then pick the smallest model that can produce a trustworthy result.",
  );

  const decisionRules = [
    {
      icon: Gauge,
      title: t("Use fast models for exploration"),
      body: t(
        "Fast general models are useful when the cost of being wrong is low: brainstorming, first drafts, rewriting short text, summarizing familiar material, and asking for a quick explanation.",
      ),
    },
    {
      icon: ShieldAlert,
      title: t("Use reasoning models when mistakes are expensive"),
      body: t(
        "Planning, debugging, policy interpretation, product decisions, and financial or legal-adjacent summaries need slower review. A reasoning model is useful when the answer must expose assumptions and tradeoffs.",
      ),
    },
    {
      icon: CheckCircle2,
      title: t("Use coding models when output must fit a codebase"),
      body: t(
        "Coding tasks are not just text generation. The answer has to respect APIs, file boundaries, dependency versions, tests, and existing style. Start with a coding-capable model when implementation detail matters.",
      ),
    },
    {
      icon: GitCompare,
      title: t("Compare models only when comparison changes the decision"),
      body: t(
        "Running every prompt through many models wastes attention. Compare models when the task is ambiguous, the output will be published, or a wrong answer would create rework.",
      ),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Organization",
      name: "Deni AI",
    },
    publisher: {
      "@type": "Organization",
      name: "Deni AI",
    },
    mainEntityOfPage: "https://deniai.app/guides/model-selection",
  };

  return (
    <main className="min-h-screen bg-background" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <article className="px-4 pb-20 pt-32 md:pt-40">
        <div className="mx-auto max-w-4xl">
          <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">
            {t("AI Guides")}
          </Link>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          <p className="mt-6 text-base leading-8 text-muted-foreground">{description}</p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {decisionRules.map((rule) => (
              <section
                key={rule.title}
                className="rounded-[1.5rem] border border-border bg-card p-6"
              >
                <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-secondary">
                  <rule.icon className="size-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{rule.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{rule.body}</p>
              </section>
            ))}
          </div>

          <section className="mt-12 space-y-5 text-sm leading-8 text-muted-foreground">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("A simple selection workflow")}
            </h2>
            <p>
              {t(
                "First, classify the task. Is it drafting, analysis, coding, translation, research, or decision support? The category matters more than the model name because it defines what a good answer looks like.",
              )}
            </p>
            <p>
              {t(
                "Second, classify the risk. Low-risk work can start with a fast model. Medium-risk work should be reviewed against requirements. High-risk work should use stronger reasoning and a separate verification pass.",
              )}
            </p>
            <p>
              {t(
                "Third, look at the failure mode. If the model might invent facts, ask for sources and verify them. If it might write invalid code, run tests. If it might flatten nuance, ask another model to critique the tone.",
              )}
            </p>
            <p>
              {t(
                "Finally, stop when the answer is good enough for the next human step. The goal is not to find a perfect model. The goal is to reduce uncertainty enough to keep moving responsibly.",
              )}
            </p>
          </section>

          <section className="mt-12 rounded-[1.5rem] border border-border/70 bg-secondary/20 p-6">
            <h2 className="text-xl font-semibold tracking-tight">{t("Model choice checklist")}</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
              <li>{t("What kind of output do I need: draft, answer, plan, code, or critique?")}</li>
              <li>{t("What happens if the answer is wrong or incomplete?")}</li>
              <li>{t("Can a faster model produce a usable first pass?")}</li>
              <li>{t("Do I need a second model to challenge the assumptions?")}</li>
              <li>{t("What human verification step will happen before this is used?")}</li>
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/guides/verify-ai-answers"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("Next: verify AI answers")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/models"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("See available models")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
