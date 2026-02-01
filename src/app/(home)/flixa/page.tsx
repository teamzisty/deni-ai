import { ArrowRight, Code2, Zap, Brain, Terminal, Sparkles, Download } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiGoogle, SiWindsurf } from "@icons-pack/react-simple-icons";

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

function IDECard({
  name,
  description,
  href,
  icon,
  delay,
}: {
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  delay: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col items-center p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover-lift animate-fade-in-up transition-all duration-300 hover:border-primary/40 ${delay}`}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-4 text-4xl">{icon}</div>
        <h3 className="text-lg font-semibold mb-1">{name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
          <Download className="w-4 h-4 mr-1.5" />
          Install
        </span>
      </div>
    </Link>
  );
}

export default function FlixaPage() {
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
              <Code2 className="w-3.5 h-3.5 mr-1.5" />
              {t("AI Coding Agent")}
            </Badge>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[1.05] mb-6 animate-fade-in-up">
              <span className="block">{t("Flixa")}</span>
              <span className="block mt-1 text-gradient">{t("Your AI Coding Partner")}</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 animate-fade-in-up delay-150">
              {t(
                "Supercharge your development workflow with AI-powered coding assistance. Available for VS Code, Cursor, Windsurf, and more.",
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <Button
                size="lg"
                asChild
                className="group h-12 px-6 rounded-xl text-base font-medium"
              >
                <Link
                  href="https://marketplace.visualstudio.com/items?itemName=deniai.flixa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 w-4 h-4" />
                  {t("Install for VS Code")}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="group h-12 px-6 rounded-xl text-base font-medium"
              >
                <Link href="#platforms">
                  {t("View All Platforms")}
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground animate-fade-in delay-500">
              <span>{t("Powered by Deni AI")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 animate-fade-in-up">
              {t("Why Choose Flixa?")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in-up delay-100">
              {t("Built for developers who want to code faster and smarter with AI assistance.")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title={t("Intelligent Code Completion")}
              description={t(
                "Context-aware suggestions that understand your codebase. Write code faster with AI that knows your project.",
              )}
              delay="delay-100"
            />
            <FeatureCard
              icon={Zap}
              title={t("Instant Refactoring")}
              description={t(
                "Refactor code with a single command. Flixa understands your intent and transforms code intelligently.",
              )}
              delay="delay-200"
            />
            <FeatureCard
              icon={Terminal}
              title={t("Natural Language Commands")}
              description={t(
                "Describe what you want in plain English. Flixa translates your intent into working code.",
              )}
              delay="delay-300"
            />
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="relative px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 animate-fade-in-up">
              {t("Available Platforms")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in-up delay-100">
              {t("Install Flixa on your favorite IDE and start coding smarter.")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <IDECard
              name="VS Code"
              description={t("Official Marketplace")}
              href="https://marketplace.visualstudio.com/items?itemName=deniai.flixa"
              icon={
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 fill-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Visual Studio Code</title>
                  <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
                </svg>
              }
              delay="delay-100"
            />
            <IDECard
              name="Cursor"
              description={t("Open VSX Registry")}
              href="https://open-vsx.org/extension/deniai/flixa"
              icon={
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 fill-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Cursor</title>
                  <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
                </svg>
              }
              delay="delay-200"
            />
            <IDECard
              name="Windsurf"
              description={t("Open VSX Registry")}
              href="https://open-vsx.org/extension/deniai/flixa"
              icon={<SiWindsurf className="w-8 h-8" />}
              delay="delay-300"
            />
            <IDECard
              name="Antigravity"
              description={t("Open VSX Registry")}
              href="https://open-vsx.org/extension/deniai/flixa"
              icon={<SiGoogle className="w-8 h-8" />}
              delay="delay-400"
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
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6 animate-fade-in-up" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] mb-4 animate-fade-in-up">
                {t("Ready to Code Smarter?")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto animate-fade-in-up delay-100">
                {t(
                  "Join developers who are already building faster with Flixa. Install now and experience the future of coding.",
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
                <Button size="lg" asChild className="h-12 px-6 rounded-xl text-base font-medium">
                  <Link
                    href="https://marketplace.visualstudio.com/items?itemName=deniai.flixa"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 w-4 h-4" />
                    {t("Get Flixa for VS Code")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 px-6 rounded-xl text-base font-medium"
                >
                  <Link href="/">
                    {t("Try Deni AI")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
