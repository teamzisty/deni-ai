import { Metadata } from "next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Search, Brain, FileText, Zap, BrainCog } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Search Features - ${BRAND_NAME}`,
  description:
    `Discover powerful search capabilities in ${BRAND_NAME} including research mode, canvas documents, and lightning-fast results.`,
};

export default function SearchFeaturesPage() {
  const features = [
    {
      icon: Search,
      title: "Search Quickly",
      description:
        "No setup is required. Simply tell the AI to search, and it will perform the search.",
    },
    {
      icon: Zap,
      title: "Ultra Faster",
      description:
        "Our optimized search logic performs web searches in an instant and passes the content on to AI.",
    },
    {
      icon: FileText,
      title: "Canvas Documents",
      description:
        "By summarizing the results of AI searches on Canvas, you can easily read them.",
    },
  ];

  const researchFeatures = [
    {
      icon: Brain,
      title: "Intelligent Research",
      description:
        "Advanced AI-powered research that understands context and intent for more accurate results.",
    },
    {
      icon: Zap,
      title: "Autonomous Search",
      description:
        "Our research mode allows you to search the web autonomously, summarizing information quickly.",
    },
    {
      icon: BrainCog,
      title: "Research Modes",
      description:
        "You can choose the depth of your research. Would you like more details? No problem.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{BRAND_NAME} Search</h1>
          <p className="text-xl text-muted-foreground">
            Search features that empower you to find information quickly and
            efficiently.
          </p>
        </div>

        <div className="text-start mb-6">
          <h2 className="text-2xl font-bold mb-4">Search</h2>
          <p className="text-lg text-muted-foreground">
            Find information faster with detailed content.
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
          <h2 className="text-2xl font-bold mb-4">Research</h2>
          <p className="text-lg text-muted-foreground">
            Autonomously research the web and summarize information on Canvas.
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
            Ready to Experience Advanced Search?
          </h2>
          <p className="text-muted-foreground mb-6">
            Try {BRAND_NAME}'s powerful search features and transform how you
            discover and research information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/chat">
                Start Searching
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
