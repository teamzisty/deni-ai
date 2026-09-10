import type { Metadata } from "next";
import { getExtracted, getLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  HOME_ALTERNATE_NAMES,
  HOME_DESCRIPTION,
  HOME_DESCRIPTION_JA,
  HOME_TITLE,
  HOME_TITLE_JA,
  publicAlternates,
} from "@/lib/seo";
import { HomeFeaturedBadge } from "./home-featured-badge";
import { ClientHome } from "./home-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = locale === "ja" ? HOME_TITLE_JA : HOME_TITLE;
  const description = locale === "ja" ? HOME_DESCRIPTION_JA : HOME_DESCRIPTION;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: await publicAlternates("/home"),
    openGraph: {
      title,
      description,
      locale: locale === "ja" ? "ja_JP" : "en_US",
    },
    twitter: {
      title,
      description,
    },
  };
}

/**
 * JSON-LD needs next-intl (cookies/headers for locale). Keep it behind Suspense
 * so the page shell stays instant under cacheComponents.
 */
async function HomeJsonLd() {
  const t = await getExtracted();
  const webApplicationDescription = t(
    "Open Deni Chat in your browser. Deni AI gives you GPT, Claude, Gemini and more in one free workspace.",
  );
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Deni AI",
      alternateName: [...HOME_ALTERNATE_NAMES],
      url: "https://deniai.app",
      description: webApplicationDescription,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web, Windows, macOS",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: t("Is Deni Chat the same as Deni AI?"),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(
              "Yes. Deni Chat is the chat workspace of Deni AI. Both names refer to the same free multi-model AI chat site at deniai.app, with GPT, Claude, Gemini, and other models in one place.",
            ),
          },
        },
        {
          "@type": "Question",
          name: t("Is there a Deni Chat APK or Android app?"),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(
              "Deni Chat runs in the browser on any phone, so you do not need an APK. The official installable app is the Deni AI desktop app for Windows and macOS at deniai.app/desktop. Avoid third-party APK sites that claim to offer Deni Chat for Android.",
            ),
          },
        },
        {
          "@type": "Question",
          name: t("What makes Deni AI different from a single-model chat app?"),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(
              "Deni AI lets people compare and switch between multiple providers in one place so they can choose the model that fits the task.",
            ),
          },
        },
        {
          "@type": "Question",
          name: t("Who is Deni AI for?"),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(
              "Deni AI is for people who use AI repeatedly in real workflows, including developers, founders, students, operators, and teams.",
            ),
          },
        },
        {
          "@type": "Question",
          name: t("Is Deni AI free to try?"),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(
              "Yes. Free access is available with usage limits, and the public site explains features, guides, privacy, and policies before signup.",
            ),
          },
        },
        {
          "@type": "Question",
          name: t("Where can I learn good multi-model habits?"),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(
              "The Blog and AI Guides cover model selection, answer verification, bilingual writing, when not to use AI, and practical multi-model habits.",
            ),
          },
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeJsonLd />
      </Suspense>
      <ClientHome
        featuredBadge={
          <Suspense fallback={null}>
            <HomeFeaturedBadge />
          </Suspense>
        }
      />
    </>
  );
}
