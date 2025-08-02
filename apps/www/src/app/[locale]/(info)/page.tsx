import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { BrainCircuit, Rocket, Zap } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Home() {
  const t = await getTranslations("landing");
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background via-primary/10 to-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 text-sm font-medium">
              <Rocket size={16} className="fill-foreground text-foreground mr-1" />
              {t("hero.badge")}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              {t("hero.title")}
              <span className="block underline underline-offset-12 decoration-primary decoration-4 bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mb-8">
              {t("hero.subtitle")}
            </p>
            <Button size="lg" asChild>
              <Link href="/chat">{t("hero.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              {t("features.title", { brandName: BRAND_NAME })}
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              {t("features.subtitle", { brandName: BRAND_NAME })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 cursor-default">
            <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/60">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("features.fast.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("features.fast.description")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/60">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <BrainCircuit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("features.smart.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("features.smart.description")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/60">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("features.customizable.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("features.customizable.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 md:py-32 bg-secondary/60">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
              {t("cta.startChatting")}
            </h2>
            <p className="text-muted-foreground md:text-lg mb-8">
              {t("cta.title", { brandName: BRAND_NAME })}
            </p>
            <Button size="lg" asChild>
              <Link href="/chat">{t("cta.getStartedFree")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
