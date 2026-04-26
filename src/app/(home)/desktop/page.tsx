import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { DesktopClient } from "./desktop-client";
import type { DesktopDownloads, DesktopRelease, DesktopReleaseAsset } from "./types";

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
  const title = t("Desktop App");
  const description = t(
    "Download the Deni AI desktop app for tray access, notifications, and quick reopen during daily work.",
  );

  return {
    title,
    description,
    alternates: {
      canonical: "https://deniai.app/desktop",
    },
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

  return <DesktopClient downloads={downloads} />;
}
