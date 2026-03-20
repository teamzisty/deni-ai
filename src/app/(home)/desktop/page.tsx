import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { DesktopClient } from "./desktop-client";

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  assets: GitHubReleaseAsset[];
  html_url: string;
  tag_name: string;
};

type DesktopDownloads = {
  version: string | null;
  releaseUrl: string;
  assets: GitHubReleaseAsset[];
};

const FALLBACK_RELEASE_URL = "https://github.com/deniaiapp/desktop/releases";

async function getDesktopDownloads(): Promise<DesktopDownloads> {
  try {
    const response = await fetch("https://api.github.com/repos/deniaiapp/desktop/releases", {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return {
        version: null,
        releaseUrl: FALLBACK_RELEASE_URL,
        assets: [],
      };
    }

    const releases = (await response.json()) as GitHubRelease[];
    const latestRelease = releases.find((release) => release.assets.length > 0);

    if (!latestRelease) {
      return {
        version: null,
        releaseUrl: FALLBACK_RELEASE_URL,
        assets: [],
      };
    }

    return {
      version: latestRelease.tag_name.replace(/^v/, ""),
      releaseUrl: latestRelease.html_url,
      assets: latestRelease.assets,
    };
  } catch {
    return {
      version: null,
      releaseUrl: FALLBACK_RELEASE_URL,
      assets: [],
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const title = t("Deni AI Desktop");
  const description = t(
    "Deni AI Desktop brings tray access, native notifications, and a lightweight desktop companion for faster everyday use.",
  );

  return {
    title,
    description,
    openGraph: {
      title: `${title} by Deni AI`,
      description,
    },
  };
}

export default async function DesktopPage() {
  const downloads = await getDesktopDownloads();

  return <DesktopClient downloads={downloads} />;
}
