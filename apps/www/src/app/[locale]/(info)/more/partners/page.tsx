import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { ExternalLink, Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { BRAND_NAME } from "@/lib/constants";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "partners" });
  return {
    title: t("metadata.title", { brandName: BRAND_NAME }),
    description: t("metadata.description", { brandName: BRAND_NAME }),
  };
}

export default async function PartnersPage() {
  const t = await getTranslations("partners");
  
  const partners = [
    {
      id: 1,
      name: t("noPartners.name"),
      description: t("noPartners.description"),
      category: t("noPartners.category"),
      website: t("noPartners.website"),
      established: t("noPartners.established"),
      partnership: t("noPartners.partnership"),
    },
    {
      id: 2,
      name: t("noPartners.name"),
      description: t("noPartners.description"),
      category: t("noPartners.category"),
      website: t("noPartners.website"),
      established: t("noPartners.established"),
      partnership: t("noPartners.partnership"),
    },
    {
      id: 3,
      name: t("noPartners.name"),
      description: t("noPartners.description"),
      category: t("noPartners.category"),
      website: t("noPartners.website"),
      established: t("noPartners.established"),
      partnership: t("noPartners.partnership"),
    },
  ];

  const partnerCategories = [
    "All",
    "AI Technology",
    "Cloud Infrastructure",
    "Cloud Services",
    "AI Safety",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{partners.length}+</div>
            <div className="text-sm text-muted-foreground">
              Technology Partners
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">2+</div>
            <div className="text-sm text-muted-foreground">Cloud Providers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">
              Support Coverage
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {partners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <Badge variant="secondary">{partner.category}</Badge>
              </div>
              <CardTitle className="text-xl">{partner.name}</CardTitle>
              <CardDescription className="text-sm">
                {partner.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("stats.partnership")}</span>
                  <span className="font-medium">{partner.partnership}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("stats.established")}</span>
                  <span className="font-medium">{partner.established}</span>
                </div>
                <div className="pt-3 border-t">
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    {t("visitWebsite")}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Partnership Benefits */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("benefits.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("benefits.privateCloud.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("benefits.privateCloud.description")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("benefits.freeUnlimited.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("benefits.freeUnlimited.description")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("benefits.customApi.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("benefits.customApi.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Partnership Inquiry */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            {t("cta.title")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t("cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button disabled>
              {/* <Link href="mailto:partnerships@deni-ai.com"> */}
                {t("cta.contactTeam")} <Badge variant="secondary">{t("cta.soon")}</Badge>
              {/* </Link> */}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">{t("cta.generalInquiry")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}