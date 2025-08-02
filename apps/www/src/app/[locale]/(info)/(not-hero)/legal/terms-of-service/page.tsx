import { BRAND_NAME } from "@/lib/constants";
import { getTranslations } from "next-intl/server";

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal.terms");
  return (
    <div className="container mx-auto px-4 md:px-6 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Terms of Service Content */}
        <div className="w-full pb-12 px-6 max-w-3xl mx-auto prose dark:prose-invert">
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
            <h2>{t("acceptance.title")}</h2>
            <p>{t("acceptance.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("eligibility.title")}</h2>
            <p>{t("eligibility.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("account.title")}</h2>
            <p>{t("account.content")}</p>
            <ul>
              <li>{t("account.items.accurate")}</li>
              <li>{t("account.items.secure")}</li>
              <li>{t("account.items.responsible")}</li>
              <li>{t("account.items.notification")}</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2>{t("userConduct.title")}</h2>
            <p>{t("userConduct.content")}</p>
            <ul>
              <li>{t("userConduct.items.illegal")}</li>
              <li>{t("userConduct.items.harmful")}</li>
              <li>{t("userConduct.items.impersonation")}</li>
              <li>{t("userConduct.items.privacy")}</li>
              <li>{t("userConduct.items.spam")}</li>
              <li>{t("userConduct.items.security")}</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2>{t("intellectualProperty.title")}</h2>
            <p>{t("intellectualProperty.content", { brandName: BRAND_NAME })}</p>
          </div>

          <div className="mb-10">
            <h2>{t("userContent.title")}</h2>
            <p>{t("userContent.content")}</p>
            <p>{t("userContent.license")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("disclaimers.title")}</h2>
            <p>{t("disclaimers.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("limitation.title")}</h2>
            <p>{t("limitation.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("indemnification.title")}</h2>
            <p>{t("indemnification.content")}</p>
          </div>

          <div className="mb-10">
            <h2>{t("termination.title")}</h2>
            <p>{t("termination.content")}</p>
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
