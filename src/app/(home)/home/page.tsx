import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { ClientHome } from "./home-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const description = t(
    "Free multi-model AI chat with GPT, Claude, Gemini, and more in one place.",
  );

  return {
    title: {
      absolute: "Deni AI",
    },
    description,
    openGraph: {
      title: "Deni AI",
      description,
    },
    twitter: {
      title: "Deni AI",
      description,
    },
  };
}

export default async function Home() {
  const t = await getExtracted();
  const webApplicationDescription = t(
    "Access the latest AI models without breaking the bank. Deni AI brings premium intelligence to everyone, completely free.",
  );
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Deni AI",
      url: "https://deniai.app",
      description: webApplicationDescription,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
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
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ClientHome />
    </>
  );
}
