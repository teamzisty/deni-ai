import type { Metadata } from "next";
import { BrainCircuit, Globe, Lock, Zap, Users, Code2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";
import { LoginButton } from "@/components/login-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("About");
  const description = t(
    "Deni AI is a free, fast, and private multi-model AI chat platform. Access GPT, Claude, Gemini, and more from a single interface.",
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

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-foreground mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function AboutPage() {
  const t = useExtracted();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Deni AI",
    url: "https://deniai.app",
    description: "A free, fast, and private multi-model AI chat platform.",
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
            {t("About Deni AI")}
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            {t(
              "We believe everyone deserves access to the best AI technology. Deni AI brings all the leading AI models together in one simple, free platform.",
            )}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="relative px-4 pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-border bg-card p-8 md:p-10">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              {t("Our Mission")}
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
              <p>
                {t(
                  "AI is transforming the way we work, learn, and create. But access to the latest models is fragmented across multiple platforms, each with its own subscription and interface.",
                )}
              </p>
              <p>
                {t(
                  "Deni AI solves this by providing a unified interface to all the top AI models — GPT, Claude, Gemini, Grok, and more — so you can choose the right model for every task without juggling multiple subscriptions.",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative px-4 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              {t("What We Stand For")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ValueCard
              icon={Globe}
              title={t("Accessible")}
              description={t(
                "Free to use with generous limits. Premium AI should not be locked behind expensive paywalls.",
              )}
            />
            <ValueCard
              icon={Zap}
              title={t("Fast")}
              description={t(
                "Optimized infrastructure delivers instant responses. No waiting, just results.",
              )}
            />
            <ValueCard
              icon={Lock}
              title={t("Private")}
              description={t(
                "Your conversations stay yours. We do not use your data to train models.",
              )}
            />
            <ValueCard
              icon={BrainCircuit}
              title={t("Multi-Model")}
              description={t(
                "Access the latest models from OpenAI, Anthropic, Google, xAI, and more from one interface.",
              )}
            />
            <ValueCard
              icon={Code2}
              title={t("Developer-Friendly")}
              description={t(
                "Built by developers, for everyone. Bring your own API keys or use ours.",
              )}
            />
            <ValueCard
              icon={Users}
              title={t("Team Ready")}
              description={t(
                "Collaborate with your team. Share usage and manage access from a single dashboard.",
              )}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-border bg-card p-8 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              {t("Ready to Get Started?")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              {t(
                "Join thousands of users who are already experiencing the future of AI assistance.",
              )}
            </p>
            <LoginButton />
          </div>
        </div>
      </section>
    </main>
  );
}
