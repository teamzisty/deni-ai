import { BRAND_NAME } from "@/lib/constants";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function UpgradePage() {
  const t = await getTranslations("upgrade");
  const plans = [
    {
      name: t("plans.free.name"),
      price: "$0",
      period: t("plans.free.period"),
      contributions: 0,
      features: [
        t("plans.free.features.unlimitedBasic"),
        t("plans.free.features.premiumMessages"),
        t("plans.free.features.communitySupport"),
        t("plans.free.features.emailDiscordSupport"),
      ],
      current: true,
    },
    {
      name: t("plans.plus.name"),
      price: "$5",
      period: t("plans.plus.period"),
      features: [
        t("plans.plus.features.includesFree"),
        t("plans.plus.features.premiumMessages"),
        t("plans.plus.features.priorityQueue"),
        t("plans.plus.features.prioritySupport"),
      ],
      popular: true,
    },
    {
      name: t("plans.pro.name"),
      price: "$9.99",
      period: t("plans.pro.period"),
      features: [
        t("plans.pro.features.includesPlus"),
        t("plans.pro.features.premiumMessages"),
        t("plans.pro.features.morePriorityQueue"),
        t("plans.pro.features.exclusiveChannels"),
        t("plans.pro.features.maxMode"),
      ],
    },
    {
      name: t("plans.max.name"),
      price: "$29.99",
      period: t("plans.max.period"),
      features: [
        t("plans.max.features.includesPro"),
        t("plans.max.features.unlimitedPremium"),
        t("plans.max.features.maxPriorityQueue"),
        t("plans.max.features.exclusiveChannels"),
      ],
    },
  ];

  const teamPlans = [
    {
      name: t("plans.team.name"),
      price: "$14.99",
      description: t("plans.team.description"),
      period: t("plans.team.period"),
      features: [
        t("plans.team.features.includesMax"),
        t("plans.team.features.unlimitedFor10"),
        t("plans.team.features.teamTools"),
      ],
    },
    {
      name: t("plans.enterprise.name"),
      price: t("plans.enterprise.price"),
      period: t("plans.enterprise.period"),
      features: [
        t("plans.enterprise.features.includesTeam"),
        t("plans.enterprise.features.unlimitedUsers"),
        t("plans.enterprise.features.privateInstance"),
      ],
    },
  ];

  if (true) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            {t("notReady.title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("notReady.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("subtitle", { brandName: BRAND_NAME })}
        </p>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {t("mostPopular")}
                </span>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              {/* <CardDescription className="mt-2">
                {plan.contributions > 0
                  ? `${plan.contributions} GitHub contribution${plan.contributions > 1 ? "s" : ""} included`
                  : "No GitHub contributions"}
              </CardDescription> */}
            </CardHeader>

            <CardContent className="space-y-4 h-full flex flex-col">
              <ul className="space-y-3 mb-auto">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-6"
                variant={
                  plan.current
                    ? "outline"
                    : plan.popular
                      ? "default"
                      : "outline"
                }
                disabled={plan.current}
              >
                {plan.current ? t("currentPlan") : t("upgradeTo", { planName: plan.name })}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">{t("teamPlans")}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {teamPlans.map((plan) => (
            <Card key={plan.name} className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 h-full flex flex-col">
                <ul className="space-y-3 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-auto"
                  variant={plan.name === "Team" ? "default" : "outline"}
                >
                  {plan.name === t("plans.team.name") ? t("upgradeToTeam") : t("contactUs")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          {t("trialInfo")}
        </p>
      </div>
    </div>
  );
}
