import type { Metadata } from "next";
import { ArrowRight, Zap, Shield, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";
import { LoginButton } from "@/components/login-button";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("The AI Assistant You Deserve");
  const description = t(
    "Access GPT, Claude, Gemini and more AI models in one place. Free, fast, and private AI chat for everyone.",
  );

  return {
    title,
    description,
    openGraph: {
      title: `Deni AI — ${title}`,
      description,
    },
  };
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative p-6 rounded-lg border border-border bg-card">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-foreground mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function Home() {
  const t = useExtracted();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Deni AI",
    url: "https://deniai.app",
    description:
      "Access GPT, Claude, Gemini and more AI models in one place. Free, fast, and private AI chat for everyone.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="relative min-h-screen" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center text-center">
            {/* Main headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
              <span className="block">{t("The AI Assistant")}</span>
              <span className="block mt-1 text-muted-foreground">{t("You Deserve")}</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
              {t(
                "Access the latest AI models without breaking the bank. Deni AI brings premium intelligence to everyone, completely free.",
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <LoginButton />
              <Button variant="outline" size="lg" asChild className="group">
                <Link href="#features">
                  {t("Learn More")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-10 text-sm text-muted-foreground">
              <span>{t("No credit card required")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              {t("Why Choose Deni AI?")}
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              {t("Built for everyone who wants access to cutting-edge AI technology.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              icon={BrainCircuit}
              title={t("Latest Models")}
              description={t(
                "Access GPT-4, Claude, Gemini, and more. Always up-to-date with the newest AI capabilities.",
              )}
            />
            <FeatureCard
              icon={Zap}
              title={t("Lightning Fast")}
              description={t(
                "Optimized infrastructure for instant responses. No waiting, just pure speed.",
              )}
            />
            <FeatureCard
              icon={Shield}
              title={t("Private & Secure")}
              description={t(
                "Your conversations stay yours. Enterprise-grade security without the enterprise price.",
              )}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="relative rounded-lg border border-border bg-card p-8 md:p-10 text-center">
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
