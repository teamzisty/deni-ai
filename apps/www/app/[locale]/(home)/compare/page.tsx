"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleDollarSign,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileImage,
  Info,
  Infinity as InfinityIcon,
  Minus,
  Server,
  Shield,
  ThumbsDown,
  X,
  Zap,
  MessageCircleWarning,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Header } from "@/components/header";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  SiOpenai,
  SiClaude,
  SiGooglegemini,
} from "@icons-pack/react-simple-icons";

const ComparePage = () => {
  const t = useTranslations("compare");

  const aiServices = [
    {
      name: "Deni AI",
      logo: "✨",
      description: t("services.deniAI.description"),
      price: t("services.deniAI.price"),
      priceDescription: t("services.deniAI.priceDescription"),
      models: [
        "Claude 3.7 Sonnet",
        "GPT-4.5",
        "Gemini 2.5 Pro",
        "o1",
        "o3-mini",
        "DeepSeek R1",
        "DeepSeek V3",
      ],
      limits: t("services.deniAI.limits"),
      vision: true,
      reasoning: true,
      privacy: t("services.deniAI.privacy"),
      registration: t("services.deniAI.registration"),
      features: [
        t("services.deniAI.features.unlimited"),
        t("services.deniAI.features.noPayment"),
        t("services.deniAI.features.imageCapability"),
        t("services.deniAI.features.privacy"),
        t("services.deniAI.features.allModels"),
      ],
      cons: [],
      buttonText: t("services.deniAI.buttonText"),
      buttonLink: "",
      highlight: true,
    },
    {
      name: "ChatGPT Plus / Pro",
      logo: <SiOpenai />,
      description: t("services.chatGPT.description"),
      price: t("services.chatGPT.price"),
      priceDescription: t("services.chatGPT.priceDescription"),
      models: ["o1-pro (Pro)", "GPT 4.5", "DALL-E 3"],
      limits: t("services.chatGPT.limits"),
      vision: true,
      reasoning: true,
      privacy: t("services.chatGPT.privacy"),
      registration: t("services.chatGPT.registration"),
      features: [
        t("services.chatGPT.features.models"),
        t("services.chatGPT.features.imageGen"),
        t("services.chatGPT.features.voice"),
        t("services.chatGPT.features.browse"),
      ],
      cons: [
        t("services.chatGPT.cons.cost"),
        t("services.chatGPT.cons.rateLimits"),
        t("services.chatGPT.cons.dataTraining"),
      ],
      buttonText: t("services.chatGPT.buttonText"),
      buttonLink: "https://chat.openai.com/",
      highlight: false,
    },
    {
      name: "Claude Pro / Max",
      logo: <SiClaude />,
      description: t("services.claude.description"),
      price: t("services.claude.price"),
      priceDescription: t("services.claude.priceDescription"),
      models: ["Claude 3.7 Sonnet", "Claude 3.5 Haiku", "Claude 3.5 Sonnet"],
      limits: t("services.claude.limits"),
      vision: true,
      reasoning: true,
      privacy: t("services.claude.privacy"),
      registration: t("services.claude.registration"),
      features: [
        t("services.claude.features.models"),
        t("services.claude.features.contextWindow"),
        t("services.claude.features.speed"),
        t("services.claude.features.privacy"),
      ],
      cons: [
        t("services.claude.cons.cost"),
        t("services.claude.cons.limits"),
        t("services.claude.cons.noAPI"),
      ],
      buttonText: t("services.claude.buttonText"),
      buttonLink: "https://claude.ai/",
      highlight: false,
    },
    {
      name: "Gemini Advanced",
      logo: <SiGooglegemini />,
      description: t("services.gemini.description"),
      price: t("services.gemini.price"),
      priceDescription: t("services.gemini.priceDescription"),
      models: ["Gemini 2.0 Flash", "Gemini 2.5 Pro"],
      limits: t("services.gemini.limits"),
      vision: true,
      reasoning: true,
      privacy: t("services.gemini.privacy"),
      registration: t("services.gemini.registration"),
      features: [
        t("services.gemini.features.ultra"),
        t("services.gemini.features.googleApps"),
        t("services.gemini.features.multiModal"),
      ],
      cons: [
        t("services.gemini.cons.cost"),
        t("services.gemini.cons.ecosystem"),
        t("services.gemini.cons.newer"),
      ],
      buttonText: t("services.gemini.buttonText"),
      buttonLink: "https://gemini.google.com/",
      highlight: false,
    },
  ];

  const featureComparison = [
    {
      feature: t("features.cost.title"),
      tooltip: t("features.cost.tooltip"),
      deniAI: t("features.cost.deniAI"),
      chatGPT: t("features.cost.chatGPT"),
      claude: t("features.cost.claude"),
      gemini: t("features.cost.gemini"),
    },
    {
      feature: t("features.models.title"),
      tooltip: t("features.models.tooltip"),
      deniAI: t("features.models.deniAI"),
      chatGPT: t("features.models.chatGPT"),
      claude: t("features.models.claude"),
      gemini: t("features.models.gemini"),
    },
    {
      feature: t("features.messageLimits.title"),
      tooltip: t("features.messageLimits.tooltip"),
      deniAI: t("features.messageLimits.deniAI"),
      chatGPT: t("features.messageLimits.chatGPT"),
      claude: t("features.messageLimits.claude"),
      gemini: t("features.messageLimits.gemini"),
    },
    {
      feature: t("features.imageUnderstanding.title"),
      tooltip: t("features.imageUnderstanding.tooltip"),
      deniAI: true,
      chatGPT: true,
      claude: true,
      gemini: true,
    },
    {
      feature: t("features.webSearch.title"),
      tooltip: t("features.webSearch.tooltip"),
      deniAI: true,
      chatGPT: true,
      claude: true,
      gemini: true,
    },
    {
      feature: t("features.privacy.title"),
      tooltip: t("features.privacy.tooltip"),
      deniAI: true,
      chatGPT: "warning " + t("features.privacy.chatGPT"),
      claude: "warning " + t("features.privacy.claude"),
      gemini: "warning " + t("features.privacy.gemini"),
    },
    {
      feature: t("features.payment.title"),
      tooltip: t("features.payment.tooltip"),
      deniAI: false,
      chatGPT: true,
      claude: true,
      gemini: true,
    },
    {
      feature: t("features.imageGeneration.title"),
      tooltip: t("features.imageGeneration.tooltip"),
      deniAI: false,
      chatGPT: true,
      claude: false,
      gemini: true,
    },
    {
      feature: t("features.contextWindow.title"),
      tooltip: t("features.contextWindow.tooltip"),
      deniAI: t("features.contextWindow.deniAI"),
      chatGPT: t("features.contextWindow.chatGPT"),
      claude: t("features.contextWindow.claude"),
      gemini: t("features.contextWindow.gemini"),
    },
  ];

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      <Header />
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-background border-b border-border/40">
          <div className="flex items-center pt-16 pb-12 animate-show flex-col w-full max-w-7xl m-auto px-6 lg:px-8">
            <h1 className="px-1 text-center text-4xl font-bold tracking-tight pb-4 sm:text-5xl md:text-6xl md:px-0">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xl text-muted-foreground">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>

        {/* Service Cards */}
        <div className="w-full px-6 py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiServices.map((service, index) => (
              <Card
                key={index}
                className={cn(
                  "flex flex-col h-full",
                  service.highlight
                    ? "border-primary/50 shadow-lg shadow-primary/10"
                    : ""
                )}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl mb-2">{service.logo}</div>
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                    </div>
                    {service.highlight && (
                      <Badge className="bg-primary text-white">
                        {t("recommended")}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-bold text-lg">{service.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {service.priceDescription}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{t("topModels")}</span>
                    </div>
                    <ul className="ml-6 text-sm text-muted-foreground">
                      {service.models.slice(0, 3).map((model, idx) => (
                        <li key={idx} className="mb-1">
                          • {model}
                        </li>
                      ))}
                      {service.models.length > 3 && (
                        <li className="text-muted-foreground">
                          • +{service.models.length - 3} {t("more")}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{t("usageLimits")}</span>
                    </div>
                    <p className="ml-6 text-sm text-muted-foreground">
                      {service.limits}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{t("privacy")}</span>
                    </div>
                    <p className="ml-6 text-sm text-muted-foreground">
                      {service.privacy}
                    </p>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center mb-1">
                      <Check className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{t("keyFeatures")}</span>
                    </div>
                    <ul className="ml-6 text-sm text-muted-foreground">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="mb-1">
                          • {feature}
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-muted-foreground">
                          • +{service.features.length - 3} {t("more")}
                        </li>
                      )}
                    </ul>
                  </div>

                  {service.cons.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center mb-1">
                        <X className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{t("limitations")}</span>
                      </div>
                      <ul className="ml-6 text-sm text-muted-foreground">
                        {service.cons.slice(0, 2).map((con, idx) => (
                          <li key={idx} className="mb-1">
                            • {con}
                          </li>
                        ))}
                        {service.cons.length > 2 && (
                          <li className="text-muted-foreground">
                            • +{service.cons.length - 2} {t("more")}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className={cn(
                      "w-full",
                      service.highlight
                        ? ""
                        : "bg-muted/80 text-foreground hover:bg-muted/90"
                    )}
                    variant={service.highlight ? "default" : "outline"}
                  >
                    {service.name === "Deni AI" ? (
                      <Link href={service.buttonLink}>
                        {service.buttonText}
                      </Link>
                    ) : (
                      <a
                        href={service.buttonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        {service.buttonText}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="w-full px-6 py-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {t("detailedComparison")}
          </h2>

          <Tabs defaultValue="standard" className="w-full mb-6">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="standard">{t("standardPlans")}</TabsTrigger>
                <TabsTrigger value="premium">{t("premiumPlans")}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="standard" className="mt-6">
              <div className="bg-card/50 rounded-lg border border-border overflow-hidden">
                <TooltipProvider>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/5">
                            {t("feature")}
                          </TableHead>
                          <TableHead className="w-1/5 bg-primary/10">
                            Deni AI
                          </TableHead>
                          <TableHead className="w-1/5">ChatGPT Plus</TableHead>
                          <TableHead className="w-1/5">Claude Pro</TableHead>
                          <TableHead className="w-1/5">
                            Gemini Advanced
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureComparison.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center cursor-help">
                                    {item.feature}
                                    <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{item.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="bg-primary/5">
                              {renderFeatureValue(item.deniAI)}
                            </TableCell>
                            <TableCell>
                              {renderFeatureValue(
                                typeof item.chatGPT === "string" &&
                                  item.chatGPT.includes("|")
                                  ? item.chatGPT.split("|")[0]?.trim() || ""
                                  : item.chatGPT
                              )}
                            </TableCell>
                            <TableCell>
                              {renderFeatureValue(
                                typeof item.claude === "string" &&
                                  item.claude.includes("|")
                                  ? item.claude.split("|")[0]?.trim() || ""
                                  : item.claude
                              )}
                            </TableCell>
                            <TableCell>
                              {renderFeatureValue(item.gemini)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TooltipProvider>
              </div>
            </TabsContent>

            <TabsContent value="premium" className="mt-6">
              <div className="bg-card/50 rounded-lg border border-border overflow-hidden">
                <TooltipProvider>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/5">
                            {t("feature")}
                          </TableHead>
                          <TableHead className="w-1/5 bg-primary/10">
                            Deni AI
                          </TableHead>
                          <TableHead className="w-1/5">ChatGPT Pro</TableHead>
                          <TableHead className="w-1/5">
                            Claude Max ($100)
                          </TableHead>
                          <TableHead className="w-1/5">
                            Claude Max ($200)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureComparison.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center cursor-help">
                                    {item.feature}
                                    <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{item.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="bg-primary/5">
                              {renderFeatureValue(item.deniAI)}
                            </TableCell>
                            <TableCell>
                              {renderFeatureValue(
                                typeof item.chatGPT === "string" &&
                                  item.chatGPT.includes("|")
                                  ? item.chatGPT.split("|")[1]?.trim() || ""
                                  : item.chatGPT
                              )}
                            </TableCell>
                            <TableCell>
                              {renderFeatureValue(
                                typeof item.claude === "string" &&
                                  item.claude.includes("|")
                                  ? item.claude.split("|")[1]?.trim() || ""
                                  : item.claude
                              )}
                            </TableCell>
                            <TableCell>
                              {renderFeatureValue(
                                typeof item.claude === "string" &&
                                  item.claude.includes("|")
                                  ? item.claude.split("|")[2]?.trim() || ""
                                  : item.claude
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TooltipProvider>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>{t("pricingNote")}</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full px-6 py-12 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {t("faqTitle")}
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{t("faq.howFree.question")}</AccordionTrigger>
              <AccordionContent>{t("faq.howFree.answer")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>{t("faq.models.question")}</AccordionTrigger>
              <AccordionContent>{t("faq.models.answer")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                {t("faq.limitations.question")}
              </AccordionTrigger>
              <AccordionContent>{t("faq.limitations.answer")}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>
                {t("faq.dataHandling.question")}
              </AccordionTrigger>
              <AccordionContent>
                {t("faq.dataHandling.answer")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>{t("faq.account.question")}</AccordionTrigger>
              <AccordionContent>{t("faq.account.answer")}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="w-full py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5"></div>
          <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row gap-8 md:gap-0 items-center justify-between rounded-sm relative z-10">
            <motion.h2
              className="text-3xl sm:text-4xl font-bold text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {t("ctaTitle")}
              <br />
              {t("ctaSubtitle")}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button asChild size="lg" className="h-12 px-8 font-medium">
                <Link href="/">
                  <span className="flex items-center">
                    <span>{t("getStarted")}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
};

// Helper function to render feature values with appropriate styling
const renderFeatureValue = (value: string | boolean): React.ReactNode => {
  if (typeof value === "boolean") {
    return value ? (
      <span className="flex items-center text-green-500">
        <CheckCheck className="h-5 w-5 mr-1" />
        Yes
      </span>
    ) : (
      <span className="flex items-center text-red-500">
        <X className="h-5 w-5 mr-1" />
        No
      </span>
    );
  }

  if (typeof value === "string") {
    if (value.toLowerCase().includes("warning")) {
      return (
        <span className="flex items-center text-yellow-500">
          <MessageCircleWarning className="h-4 w-4 mr-1" />
          {value.replace("warning ", "")}
        </span>
      );
    }

    if (
      value.toLowerCase().includes("unlimited") ||
      value.toLowerCase().includes("free") ||
      value.toLowerCase().includes("無制限") ||
      value.toLowerCase().includes("無料")
    ) {
      return (
        <span className="flex items-center text-green-500">
          <InfinityIcon className="h-4 w-4 mr-1" />
          {value}
        </span>
      );
    }

    if (value.includes("$")) {
      return (
        <span className="flex items-center">
          <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
          {value}
        </span>
      );
    }
  }

  return value;
};

export default ComparePage;
