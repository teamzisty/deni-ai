import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { DesktopClient } from "./desktop-client";
import type { DesktopDownloads, DesktopRelease, DesktopReleaseAsset } from "./types";
import { publicAlternates } from "@/lib/seo";

type GitHubRelease = {
  assets: DesktopReleaseAsset[];
  draft: boolean;
  html_url: string;
  prerelease: boolean;
  tag_name: string;
};

const FALLBACK_RELEASE_URL = "https://github.com/deniaiapp/desktop/releases";

function toDesktopRelease(release: GitHubRelease): DesktopRelease {
  return {
    version: release.tag_name.replace(/^v/, ""),
    releaseUrl: release.html_url,
    assets: release.assets,
  };
}

function createFallbackRelease(): DesktopRelease {
  return {
    version: null,
    releaseUrl: FALLBACK_RELEASE_URL,
    assets: [],
  };
}

async function getDesktopDownloads(): Promise<DesktopDownloads> {
  try {
    const response = await fetch("https://api.github.com/repos/deniaiapp/desktop/releases", {
      next: { revalidate: 360 },
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return {
        latestRelease: createFallbackRelease(),
        prerelease: null,
        releasesUrl: FALLBACK_RELEASE_URL,
      };
    }

    const releases = (await response.json()) as GitHubRelease[];
    const latestRelease = releases.find((release) => !release.draft && !release.prerelease);
    const prerelease = releases.find((release) => !release.draft && release.prerelease);

    return {
      latestRelease: latestRelease ? toDesktopRelease(latestRelease) : createFallbackRelease(),
      prerelease: prerelease ? toDesktopRelease(prerelease) : null,
      releasesUrl: FALLBACK_RELEASE_URL,
    };
  } catch {
    return {
      latestRelease: createFallbackRelease(),
      prerelease: null,
      releasesUrl: FALLBACK_RELEASE_URL,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("Deni Chat desktop app for Windows and macOS");
  const description = t(
    "Download the official Deni Chat desktop app for Windows and macOS. Tray access, notifications, and quick reopen. Use the web app on mobile — no Android APK.",
  );

  return {
    title,
    description,
    alternates: await publicAlternates("/desktop"),
    openGraph: {
      title: `${title} — Deni AI`,
      description,
    },
    twitter: {
      title: `${title} — Deni AI`,
      description,
    },
  };
}

export default async function DesktopPage() {
  const downloads = await getDesktopDownloads();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Deni AI Desktop",
    alternateName: ["Deni Chat desktop", "Deni Chat app"],
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows, macOS",
    url: "https://deniai.app/desktop",
    downloadUrl: "https://deniai.app/desktop",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Official Deni Chat desktop app for Windows and macOS. Tray access, notifications, and quick reopen. Not an Android APK.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <DesktopClient downloads={downloads} />
    </>
  );
}
