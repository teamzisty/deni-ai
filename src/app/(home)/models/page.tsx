import type { Metadata } from "next";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";
import { LoginButton } from "@/components/login-button";
import { models } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("AI Models");
  const description = t(
    "Access GPT, Claude, Gemini, Grok and more top AI models in one place. Compare and use the latest models from OpenAI, Anthropic, Google and xAI.",
  );

  return {
    title,
    description,
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
  openrouter: "OpenRouter",
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

  const grouped = models.reduce(
    (acc, model) => {
      const author = model.author;
      if (!acc[author]) acc[author] = [];
      acc[author].push(model);
      return acc;
    },
    {} as Record<string, typeof models>,
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

  return (
    <main className="relative min-h-screen" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
