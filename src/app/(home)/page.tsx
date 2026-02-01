import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { LoginButton } from "@/components/login-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className={`group relative p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover-lift animate-fade-in-up ${delay}`}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const t = useExtracted();

  return (
    <main className="relative min-h-screen overflow-hidden" id="main-content">
      {/* Atmospheric background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/20" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-pulse-soft delay-500" />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="mb-8 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 animate-fade-in-down"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {t("Free AI for Everyone")}
            </Badge>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[1.05] mb-6 animate-fade-in-up">
              <span className="block">{t("The AI Assistant")}</span>
              <span className="block mt-1 text-gradient">{t("You Deserve")}</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 animate-fade-in-up delay-150">
              {t(
                "Access the latest AI models without breaking the bank. Deni AI brings premium intelligence to everyone, completely free.",
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <LoginButton />
              <Button variant="outline" size="lg" asChild className="group h-12 px-6 rounded-xl text-base font-medium">
                <Link href="#features">
                  {t("Learn More")}
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground animate-fade-in delay-500">
              <span>{t("No credit card required")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 animate-fade-in-up">
              {t("Why Choose Deni AI?")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in-up delay-100">
              {t("Built for everyone who wants access to cutting-edge AI technology.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Sparkles}
              title={t("Latest Models")}
              description={t(
                "Access GPT-4, Claude, Gemini, and more. Always up-to-date with the newest AI capabilities.",
              )}
              delay="delay-100"
            />
            <FeatureCard
              icon={Zap}
              title={t("Lightning Fast")}
              description={t(
                "Optimized infrastructure for instant responses. No waiting, just pure speed.",
              )}
              delay="delay-200"
            />
            <FeatureCard
              icon={Shield}
              title={t("Private & Secure")}
              description={t(
                "Your conversations stay yours. Enterprise-grade security without the enterprise price.",
              )}
              delay="delay-300"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 md:p-12 text-center overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] mb-4 animate-fade-in-up">
                {t("Ready to Get Started?")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto animate-fade-in-up delay-100">
                {t("Join thousands of users who are already experiencing the future of AI assistance.")}
              </p>
              <div className="animate-fade-in-up delay-200">
                <LoginButton />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
