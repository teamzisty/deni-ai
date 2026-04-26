import type { Metadata } from "next";
import Link from "next/link";
import { useExtracted, useLocale } from "next-intl";
import { getExtracted } from "next-intl/server";
import { LoginButton } from "@/components/login-button";
import { models, type ModelDefinition } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("AI Models");
  const description = t(
    "Access GPT, Claude, Gemini, Grok and more top AI models in one place. Compare and use the latest models from OpenAI, Anthropic, Google and xAI.",
  );

  return {
    title,
    description,
    alternates: {
      canonical: "https://deniai.app/models",
    },
    openGraph: {
      title: `${title} — Deni AI`,
      description,
    },
  };
}

const authorLabels: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  xai: "xAI",
};

const featureStyles: Record<string, string> = {
  smartest: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  smart: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  reasoning: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  fast: "bg-green-500/10 text-green-700 dark:text-green-400",
  fastest: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  coding: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

export default function ModelsPage() {
  const t = useExtracted();
  const locale = useLocale();
  const formatNumber = new Intl.NumberFormat(locale);

  const grouped = models.reduce(
    (acc, model) => {
      const author = model.author;
      if (!acc[author]) acc[author] = [];
      acc[author].push(model);
      return acc;
    },
    {} as Record<string, ModelDefinition[]>,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI Models available on Deni AI",
    numberOfItems: models.length,
    itemListElement: models.map((model, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: model.name,
    })),
  };

  const providerGuideSummaries: Partial<Record<keyof typeof authorLabels, string>> = {
    openai: t(
      "A broad mix of general-purpose, reasoning, and coding models. Useful when you want the widest range of task coverage in one family.",
    ),
    anthropic: t(
      "Often a strong choice for structured writing, analysis, and long-form reasoning where tone and coherence matter.",
    ),
    google: t(
      "Useful when you want another high-capability option for multimodal and general productivity workflows inside the same workspace.",
    ),
    xai: t(
      "Helpful to compare against other providers when you want a different response style or model behavior for the same prompt.",
    ),
  };

  const providerGuides = Object.keys(grouped)
    .map((providerKey) => {
      const summary = providerGuideSummaries[providerKey as keyof typeof providerGuideSummaries];
      if (!summary) {
        return null;
      }

      return {
        provider: authorLabels[providerKey] ?? providerKey,
        summary,
      };
    })
    .filter((guide): guide is { provider: string; summary: string } => guide !== null);

  const selectionGuide = [
    {
      title: t("Start with the task, not the brand"),
      description: t(
        "Choose based on the job you need done: quick drafting, careful reasoning, coding, or side-by-side comparison.",
      ),
    },
    {
      title: t("Use faster models for iteration"),
      description: t(
        "When the work is exploratory, speed matters. Fast models help you refine prompts before moving to more expensive reasoning models.",
      ),
    },
    {
      title: t("Escalate to stronger reasoning when the stakes increase"),
      description: t(
        "Planning, debugging, evaluations, and nuanced tradeoffs usually benefit from a model with stronger reasoning behavior.",
      ),
    },
    {
      title: t("Compare outputs before you trust them"),
      description: t(
        "No model is correct all the time. Deni AI is most valuable when you can inspect multiple answers without changing products.",
      ),
    },
  ];

  return (
    <main className="relative min-h-screen" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="relative px-4 pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
            {t("AI Models")}
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
            {t(
              "All the top AI models from leading providers, available in one place. No separate subscriptions needed.",
            )}
          </p>
        </div>
      </section>

      {/* Models by Provider */}
      <section className="relative px-4 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl space-y-12">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-6 md:p-8">
            <h2 className="text-xl font-semibold tracking-tight">{t("How to read this page")}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(
                "This page is meant to help visitors understand the role of each model family before they sign up. Instead of only listing brand names, it explains where each provider tends to fit and how to choose a model based on the work you need to do.",
              )}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {providerGuides.map((guide) => (
              <div
                key={guide.provider}
                className="rounded-[1.5rem] border border-border/70 bg-card p-5"
              >
                <h2 className="text-lg font-semibold">{guide.provider}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{guide.summary}</p>
              </div>
            ))}
          </div>

          {Object.entries(grouped).map(([author, authorModels]) => (
            <div key={author}>
              <h2 className="text-xl font-semibold tracking-tight mb-4">
                {authorLabels[author] ?? author}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {authorModels.map((model) => (
                  <div key={model.value} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-sm">{model.name}</h3>
                      {"premium" in model && model.premium && (
                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Pro
                        </span>
                      )}
                    </div>
                    {"description" in model && model.description && (
                      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                        {model.description}
                      </p>
                    )}
                    {"contextWindow" in model && model.contextWindow ? (
                      <p className="mb-3 text-xs text-muted-foreground">
                        {t("Context window")}: {formatNumber.format(model.contextWindow)}
                      </p>
                    ) : null}
                    {model.features && (
                      <div className="flex flex-wrap gap-1.5">
                        {model.features.map((feature) => (
                          <span
                            key={feature}
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${featureStyles[feature] ?? "bg-secondary text-muted-foreground"}`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative border-y border-border/50 bg-secondary/20 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {t("A practical guide to choosing the right model")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {t(
                "People often compare providers by hype alone. In practice, a better rule is to start with what the task demands, then move to the smallest model that produces a trustworthy result. That is the operating idea behind Deni AI.",
              )}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {selectionGuide.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/70 bg-card p-6"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/use-cases">{t("See example use cases")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-border bg-card p-8 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              {t("Try All Models for Free")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              {t("Start chatting with the latest AI models today. No credit card required.")}
            </p>
            <LoginButton />
          </div>
        </div>
      </section>
    </main>
  );
}
