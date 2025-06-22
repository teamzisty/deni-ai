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
import Link from "next/link";

export default function StudentBenefitsPage() {
  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Unlimited Premium Model Uses",
      description:
        "Access to all premium AI models without usage limits. Perfect for intensive study sessions and research projects.",
    },
    {
      icon: <Crown className="h-6 w-6" />,
      title: "Discord Exclusive Roles",
      description:
        "Join our discord community with special Discord roles and access to student-only channels.",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Priority Support",
      description:
        "Get faster response times and dedicated support to help you succeed in your academic journey.",
    },
  ];

  const features = [
    "Unlimited access to o3-pro, Claude Opus 4 and other premium models",
    "Student-exclusive Discord community",
    "Priority customer support (12-24h response time)",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Student Benefits
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Pro Plan for Students</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Unlock your academic potential with unlimited access to premium AI
          models and exclusive student benefits.
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
          <CardTitle className="text-2xl">What's Included</CardTitle>
          <CardDescription>
            Everything you need to excel in your studies with AI assistance.
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
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6">
            Join the family of our students using the Pro plan to enhance their
            learning experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button disabled size="lg">
              Apply (Soon)
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Questions about teacher pricing? We offer special discounts for
          verified teachers.{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us to learn more
          </Link>
        </p>
      </div>
    </div>
  );
}
