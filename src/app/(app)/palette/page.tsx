import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import PaletteClient from "./palette-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("Palette");
  const description = t(
    "Image Generation Hub with curated models, visual prompt controls, and a gallery-first workspace.",
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

export default function PalettePage() {
  return (
    <main id="main-content">
      <PaletteClient />
    </main>
  );
}
