import { getTranslations } from "next-intl/server";

export default async function TestI18nPage() {
  const t = await getTranslations("landing");
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">I18n Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Hero Section</h2>
          <p>Title: {t("hero.title")}</p>
          <p>Subtitle: {t("hero.subtitle")}</p>
          <p>Badge: {t("hero.badge")}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Navigation</h2>
          <p>Home: {t("nav.home")}</p>
          <p>Features: {t("nav.features")}</p>
          <p>Sign In: {t("nav.signIn")}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Current Locale</h2>
          <p>Check the URL - it should be /en/test-i18n or /ja/test-i18n</p>
        </div>
      </div>
    </div>
  );
}