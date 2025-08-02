import { BRAND_NAME } from "@/lib/constants";
import { getTranslations } from "next-intl/server";

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal.privacy");
  return (
    <div className="container mx-auto px-4 md:px-6 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        <div className="w-full px-6 py-12 max-w-3xl mx-auto prose dark:prose-invert">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            {t("title")}
          </h1>
          <p className="prose prose-lg mx-auto text-muted-foreground mb-10">
            {t("lastUpdated", { date: new Date("2025-08-03T00:00:00+09:00").toLocaleDateString("ja-JP") })}
          </p>
          <div className="mb-10">
            <h2>{t("introduction.title")}</h2>
            <p>{t("introduction.content", { brandName: BRAND_NAME })}</p>
            <p>{t("introduction.operatedBy", { brandName: BRAND_NAME })}</p>
          </div>

          <div className="mb-10">
            <h2>{t("informationCollection.title")}</h2>
            <p>{t("informationCollection.content")}</p>
            <ul>
              <li>{t("informationCollection.items.personalInfo")}</li>
              <li>{t("informationCollection.items.usage")}</li>
              <li>{t("informationCollection.items.technical")}</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2>{t("informationUse.title")}</h2>
            <p>{t("informationUse.content")}</p>
            <ul>
              <li>{t("informationUse.items.service")}</li>
              <li>{t("informationUse.items.improvement")}</li>
              <li>{t("informationUse.items.communication")}</li>
              <li>{t("informationUse.items.security")}</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2>{t("dataSharing.title")}</h2>
            <p>{t("dataSharing.content")}</p>
            <ul>
              <li>{t("dataSharing.items.serviceProviders")}</li>
              <li>{t("dataSharing.items.legal")}</li>
              <li>{t("dataSharing.items.business")}</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2>{t("dataSecurity.title")}</h2>
            <p>{t("dataSecurity.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("userRights.title")}</h2>
            <p>{t("userRights.content")}</p>
            <ul>
              <li>{t("userRights.items.access")}</li>
              <li>{t("userRights.items.rectification")}</li>
              <li>{t("userRights.items.deletion")}</li>
              <li>{t("userRights.items.restriction")}</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2>{t("cookies.title")}</h2>
            <p>{t("cookies.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("changes.title")}</h2>
            <p>{t("changes.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("contact.title")}</h2>
            <p>{t("contact.content")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
