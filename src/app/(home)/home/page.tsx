import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { ClientHome } from "./home-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("The AI Assistant You Deserve");
  const description = t(
    "Access GPT, Claude, Gemini and more AI models in one place. Free, fast, and private AI chat for everyone.",
  );

  return {
    title,
    description,
    openGraph: {
      title: `Deni AI — ${title}`,
      description,
    },
  };
}

export default async function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Deni AI",
    url: "https://deniai.app",
    description:
      "Access GPT, Claude, Gemini and more AI models in one place. Free, fast, and private AI chat for everyone.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientHome />
    </>
  );
}
