"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";

const PrivacyPolicyPage = () => {
  const t = useTranslations("privacyPolicy");

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

        {/* Privacy Policy Content */}
        <div className="w-full px-6 py-12 max-w-3xl mx-auto prose dark:prose-invert">
          <div className="mb-10">
            <h2>{t("introduction.title")}</h2>
            <p>{t("introduction.content")}</p>
            <p>{t("introduction.operatedBy")}</p>
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

          <div className="text-sm text-muted-foreground mt-12">
            <p>{t("lastUpdated")} 2025-04-16</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
