import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Code2, Sparkles, Zap, Globe, Download, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function IntellipulsePage() {
  const t = await getTranslations("intellipulse");
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("title")}
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6">
            {t("subtitle")}
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                {t("features.webBased.title")}
              </CardTitle>
              <CardDescription>
                {t("features.webBased.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("features.webBased.content")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-600" />
                {t("features.vsCodeExtension.title")}
                <Badge variant="secondary" className="text-xs">
                  {t("features.vsCodeExtension.comingSoon")}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t("features.vsCodeExtension.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("features.vsCodeExtension.content")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                {t("features.freeUnlimited.title")}
              </CardTitle>
              <CardDescription>
                {t("features.freeUnlimited.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("features.freeUnlimited.content")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t("keyFeatures.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">{t("keyFeatures.vibeBasedCoding.title")}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("keyFeatures.vibeBasedCoding.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">{t("keyFeatures.intelligentSuggestions.title")}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("keyFeatures.intelligentSuggestions.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">{t("keyFeatures.multiLanguageSupport.title")}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("keyFeatures.multiLanguageSupport.description")}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">{t("keyFeatures.realTimeCollaboration.title")}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("keyFeatures.realTimeCollaboration.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">{t("keyFeatures.privacyFirst.title")}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("keyFeatures.privacyFirst.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-semibold">{t("keyFeatures.zeroSetup.title")}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("keyFeatures.zeroSetup.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/intellipulse">
                <Globe className="mr-2 h-4 w-4" />
                {t("cta.tryWebVersion")}
              </Link>
            </Button>
            <Button variant="outline" size="lg" disabled>
              <Download className="mr-2 h-4 w-4" />
              {t("cta.vsCodeExtension")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
