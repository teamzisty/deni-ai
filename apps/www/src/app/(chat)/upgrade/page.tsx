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

export default function UpgradePage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      contributions: 0,
      features: [
        "Unlimited basic messages",
        "900 premium messages per month",
        "Community support",
        "Email / Discord support",
      ],
      current: true,
    },
    {
      name: "Plus",
      price: "$5",
      period: "month",
      features: [
        "Includes all Free features",
        "1800 premium messages per month",
        "Priority AI responses queue",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "month",
      features: [
        "Includes all Plus features",
        "2400 premium messages per month",
        "More priority AI responses queue",
        "Access to exclusive channels on Discord",
        "Max mode (usage-based billing)",
      ],
    },
    {
      name: "Max",
      price: "$29.99",
      period: "month",
      features: [
        "Includes all Pro features",
        "Unlimited premium messages",
        "Max priority AI responses queue",
        "Access to exclusive channels on Discord",
      ],
    },
  ];

  const teamPlans = [
    {
      name: "Team",
      price: "$14.99",
      description: "Recommended for small teams",
      period: "month",
      features: [
        "Includes all Max features",
        "Unlimited premium messages for up to 10 users",
        "Team management tools",
      ],
    },
    {
      name: "Enterprise",
      price: "Contact us ",
      period: "custom",
      features: [
        "Includes all Team features",
        "Unlimited premium messages for unlimited users",
        "Private instance",
      ],
    },
  ];

  if (true) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Subscription Plan is not ready
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We are currently working on the subscription plans. Please check
            back later for more information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock the full potential of {BRAND_NAME} with our flexible pricing plans.
          Get more GitHub contributions and advanced features.
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
                  Most Popular
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
                {plan.current ? "Current Plan" : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Team Plans</h2>
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
                  {plan.name === "Team" ? "Upgrade to Team" : "Contact Us"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
