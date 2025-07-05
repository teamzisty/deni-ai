import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Check, Crown, MessageCircle, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function StudentBenefitsPage() {
  const t = await getTranslations("student");
  
  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: t("benefits.unlimitedPremium.title"),
      description: t("benefits.unlimitedPremium.description"),
    },
    {
      icon: <Crown className="h-6 w-6" />,
      title: t("benefits.discordRoles.title"),
      description: t("benefits.discordRoles.description"),
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: t("benefits.prioritySupport.title"),
      description: t("benefits.prioritySupport.description"),
    },
  ];

  const features = t.raw("included.features") as string[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          {t("badge")}
        </Badge>
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground mb-6">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {benefits.map((benefit, index) => (
          <Card key={index} className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                {benefit.icon}
              </div>
              <CardTitle className="text-xl">{benefit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{benefit.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{t("included.title")}</CardTitle>
          <CardDescription>
            {t("included.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">{t("cta.title")}</h3>
          <p className="text-muted-foreground mb-6">
            {t("cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button disabled size="lg">
              {t("cta.apply")}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">{t("cta.contactSupport")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          {t("teacherNote")}{" "}
          <Link href="/contact" className="text-primary hover:underline">
            {t("contactLearnMore")}
          </Link>
        </p>
      </div>
    </div>
  );
}