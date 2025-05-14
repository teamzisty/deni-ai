"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { StatusAlert } from "@/components/StatusAlert";

const TermsOfServicePage = () => {
  const t = useTranslations("termsOfService");

  return (
    <main className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-background border-b border-border/40">
          <div className="flex items-center pt-16 pb-12 animate-show flex-col w-full max-w-7xl m-auto px-6 lg:px-8">
            <h1 className="px-1 text-center text-4xl font-bold tracking-tight pb-4 sm:text-5xl md:text-6xl md:px-0">
              {t("title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xl text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Terms of Service Content */}
        <div className="w-full pb-12 px-6 max-w-3xl mx-auto prose dark:prose-invert">
          <div className="mb-10">
            <h2>{t("introduction.title")}</h2>
            <p>{t("introduction.content")}</p>
            <p>{t("introduction.operatedBy")}</p>
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
            <p>{t("intellectualProperty.content")}</p>
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

          <div className="text-sm text-muted-foreground mt-12">
            <p>{t("lastUpdated")} 2025-04-16</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TermsOfServicePage; 