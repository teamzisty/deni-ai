import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { LockIcon, Rocket, Zap } from "lucide-react";
import { BRAND_NAME, GITHUB_URL } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Home() {
  const t = await getTranslations("landing");
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-6 text-center relative my-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          {t("hero.title")}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("hero.subtitle")}
        </p>
        <Badge className="bg-orange-500 text-white mb-2">
          <Rocket className="inline" />
          <span className="ml-1">{t("hero.badge")}</span>
        </Badge>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/chat">{t("hero.getStarted")}</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="space-y-1 mb-8 text-center">
          <h1 className="text-3xl font-bold text-center">
            {t("features.title", { brandName: BRAND_NAME })}
          </h1>
          <p className="text-center text-muted-foreground">
            {t("features.subtitle", { brandName: BRAND_NAME })}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6 h-full">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 p-6 rounded-lg flex-1 flex flex-col max-h-[250px]">
              <h3 className="text-lg font-semibold mb-4">
                {t("features.customization.colors")}
              </h3>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-4 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.blue")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.purple")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.green")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.orange")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.red")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.pink")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.indigo")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">
                    {t("features.customization.yellow")}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t("features.customization.description")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                {t("features.customization.fullyCustomizable")}
              </h3>
              <p className="text-muted-foreground">
                {t("features.customization.customize")}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-6 h-full">
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono overflow-auto flex flex-col min-h-[250px]">
              <div className="whitespace-nowrap">$ git clone {GITHUB_URL}</div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.cloning")}
              </div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.countingObjects")}
              </div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.compressingObjects")}
              </div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.totalObjects")}
              </div>
              <div className="whitespace-nowrap">
                {t("terminal.packReused")}
              </div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.receivingObjects")}
              </div>
              <div className="whitespace-nowrap">{t("terminal.done")}</div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.resolvingDeltas")}
              </div>
              <div className="whitespace-nowrap">
                {">"} {t("terminal.unpackingObjects")}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                {t("features.freeAndOpen.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("features.freeAndOpen.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 bg-secondary/60 py-10 rounded-lg">
        <div className="space-y-1 mb-8 text-center">
          <h1 className="text-3xl font-bold text-center">
            {t("features.pricing.title")}
          </h1>
          <p className="text-center text-muted-foreground">
            {t("features.pricing.subtitle", { brandName: BRAND_NAME })}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Deni AI - Free */}
          <Card className="bg-gradient-to-br from-background to-primary/60 relative">
            <Badge className="absolute -top-2 left-4">
              {t("features.pricing.recommended")}
            </Badge>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-blue-500 dark:text-blue-400">
                {BRAND_NAME}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("features.pricing.deniDescription")}
              </CardDescription>
              <div className="text-3xl font-bold text-blue-500 dark:text-blue-400">
                $0
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("features.pricing.month")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Zap className="text-blue-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.deniFeatures.unlimited")}
                  </span>
                </li>
                <li className="flex items-center">
                  <Zap className="text-blue-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.deniFeatures.openSource")}
                  </span>
                </li>
                <li className="flex items-center">
                  <Zap className="text-blue-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.deniFeatures.customizable")}
                  </span>
                </li>
                <li className="flex items-center">
                  <Zap className="text-blue-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.deniFeatures.privacy")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* T3 Chat */}
          <Card className="shadow-lg relative">
            <Badge className="absolute -top-2 left-4" variant="secondary">
              {t("features.pricing.t3Features.closedSource")}
            </Badge>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">T3 Chat</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("features.pricing.t3Description")}
              </CardDescription>
              <div className="text-3xl font-bold">
                $8
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("features.pricing.month")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Zap className="text-pink-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.t3Features.basic")}
                  </span>
                </li>
                <li className="flex items-center">
                  <Zap className="text-pink-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.t3Features.limited")}
                  </span>
                </li>
                <li className="flex items-center">
                  <LockIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {t("features.pricing.t3Features.closedSource")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* ChatGPT */}
          <Card className="shadow-lg relative">
            <Badge className="absolute -top-2 left-4" variant="secondary">
              {t("features.pricing.chatgptFeatures.closedSource")}
            </Badge>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">ChatGPT Plus</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("features.pricing.chatgptDescription")}
              </CardDescription>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                $20
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("features.pricing.month")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Zap className="text-green-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.chatgptFeatures.gpt4")}
                  </span>
                </li>
                <li className="flex items-center">
                  <Zap className="text-green-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.chatgptFeatures.plugins")}
                  </span>
                </li>
                <li className="flex items-center">
                  <LockIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {t("features.pricing.chatgptFeatures.closedSource")}
                  </span>
                </li>
                <li className="flex items-center">
                  <LockIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {t("features.pricing.chatgptFeatures.usageLimits")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Claude */}
          <Card className="shadow-lg relative">
            <Badge className="absolute -top-2 left-4" variant="secondary">
              {t("features.pricing.claudeFeatures.closedSource")}
            </Badge>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">Claude Pro</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("features.pricing.claudeDescription")}
              </CardDescription>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                $20
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("features.pricing.month")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Zap className="text-orange-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.claudeFeatures.latest")}
                  </span>
                </li>
                <li className="flex items-center">
                  <Zap className="text-orange-500 mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {t("features.pricing.claudeFeatures.priority")}
                  </span>
                </li>
                <li className="flex items-center">
                  <LockIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {t("features.pricing.claudeFeatures.closedSource")}
                  </span>
                </li>
                <li className="flex items-center">
                  <LockIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {t("features.pricing.claudeFeatures.usageLimits")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">{t("features.setup.title")}</h2>
        <p className="text-lg text-muted-foreground mb-8">
          {t("features.setup.description")}
          <br />
          {t("cta.title", { brandName: BRAND_NAME })}
        </p>
        <Button size="lg">{t("cta.gettingStarted")}</Button>
      </section>

      {/* Final CTA with Large Button */}
      <section className="bg-black text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">{t("cta.startChatting")}</h2>
          <Button variant="secondary" size="lg">
            {t("cta.getStartedFree")}
          </Button>
        </div>
      </section>
    </div>
  );
}
