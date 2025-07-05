import { Metadata } from "next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Search, Brain, FileText, Zap, BrainCog } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/navigation";
import { BRAND_NAME } from "@/lib/constants";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("metadata.title", { brandName: BRAND_NAME }),
    description: t("metadata.description", { brandName: BRAND_NAME }),
  };
}

export default async function SearchFeaturesPage() {
  const t = await getTranslations("search");
  const features = [
    {
      icon: Search,
      title: t("search.features.searchQuickly.title"),
      description: t("search.features.searchQuickly.description"),
    },
    {
      icon: Zap,
      title: t("search.features.ultraFaster.title"),
      description: t("search.features.ultraFaster.description"),
    },
    {
      icon: FileText,
      title: t("search.features.canvasDocuments.title"),
      description: t("search.features.canvasDocuments.description"),
    },
  ];

  const researchFeatures = [
    {
      icon: Brain,
      title: t("research.features.intelligentResearch.title"),
      description: t("research.features.intelligentResearch.description"),
    },
    {
      icon: Zap,
      title: t("research.features.autonomousSearch.title"),
      description: t("research.features.autonomousSearch.description"),
    },
    {
      icon: BrainCog,
      title: t("research.features.researchModes.title"),
      description: t("research.features.researchModes.description"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("title", { brandName: BRAND_NAME })}</h1>
          <p className="text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="text-start mb-6">
          <h2 className="text-2xl font-bold mb-4">{t("search.title")}</h2>
          <p className="text-lg text-muted-foreground">
            {t("search.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="text-start mb-6">
          <h2 className="text-2xl font-bold mb-4">{t("research.title")}</h2>
          <p className="text-lg text-muted-foreground">
            {t("research.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {researchFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("cta.subtitle", { brandName: BRAND_NAME })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/chat">
                {t("cta.startSearching")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
