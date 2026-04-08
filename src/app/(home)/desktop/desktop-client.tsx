"use client";

import React from "react";
import { motion } from "motion/react";
import {
  AppWindowMac,
  ArrowRight,
  BellRing,
  ChevronDown,
  Download,
  Feather,
  Package,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { BlurReveal } from "@/components/blur-reveal";
import { HighlightedText } from "@/components/highlighted-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DesktopRelease = {
  version: string | null;
  releaseUrl: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
};

type DesktopDownloads = {
  latestRelease: DesktopRelease;
  prerelease: DesktopRelease | null;
  releasesUrl: string;
};

type DownloadOption = {
  id: string;
  shortLabel: string;
  href: string;
  os: "windows" | "macos" | "linux";
  arch: "x64" | "arm64";
  format: string;
};

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string;
    architecture?: string;
  };
};

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl border border-border bg-card/20 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-card hover:shadow-xl"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function DetailCard({
  label,
  title,
  body,
  delay = 0,
}: {
  label: string;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-border bg-card/30 p-5 backdrop-blur-sm"
    >
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function normalizeArchitecture(raw: string): "x64" | "arm64" | null {
  const value = raw.toLowerCase();

  if (value.includes("arm") || value.includes("aarch")) {
    return "arm64";
  }

  if (
    value.includes("x86_64") ||
    value.includes("x64") ||
    value.includes("amd64") ||
    value.includes("intel")
  ) {
    return "x64";
  }

  return null;
}

function detectPreferredPlatform(): {
  os: DownloadOption["os"] | null;
  arch: DownloadOption["arch"] | null;
} {
  if (typeof window === "undefined") {
    return { os: null, arch: null };
  }

  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData;
  const platformSource = `${userAgentData?.platform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent}`;
  const architectureSource = `${userAgentData?.architecture ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent}`;
  const platform = platformSource.toLowerCase();

  let os: DownloadOption["os"] | null = null;

  if (platform.includes("win")) {
    os = "windows";
  } else if (platform.includes("mac")) {
    os = "macos";
  } else if (platform.includes("linux") || platform.includes("x11")) {
    os = "linux";
  }

  return {
    os,
    arch: normalizeArchitecture(architectureSource),
  };
}

function parseDownloadOptions(assets: DesktopRelease["assets"]): DownloadOption[] {
  return assets
    .map((asset) => {
      const { name, browser_download_url: href } = asset;

      if (/\.sig$/i.test(name) || /^latest\.json$/i.test(name) || /\.app\.tar\.gz$/i.test(name)) {
        return null;
      }

      let os: DownloadOption["os"] | null = null;
      if (/_windows_/i.test(name)) {
        os = "windows";
      } else if (/_darwin_/i.test(name)) {
        os = "macos";
      } else if (/_linux_/i.test(name)) {
        os = "linux";
      }

      if (!os) {
        return null;
      }

      const archMatch = name.match(/_(aarch64|arm64|x64|x86_64|amd64)(?=[._-])/i);
      const arch = normalizeArchitecture(archMatch?.[1] ?? "");

      if (!arch) {
        return null;
      }

      let format = "";
      if (/setup\.exe$/i.test(name)) {
        format = ".exe";
      } else if (/\.msi$/i.test(name)) {
        format = ".msi";
      } else if (/\.dmg$/i.test(name)) {
        format = ".dmg";
      } else if (/\.appimage$/i.test(name)) {
        format = "AppImage";
      } else if (/\.deb$/i.test(name)) {
        format = ".deb";
      } else if (/\.rpm$/i.test(name)) {
        format = ".rpm";
      } else {
        return null;
      }

      const archLabel = arch === "arm64" ? "ARM64" : "x64";
      const macLabel = os === "macos" ? (arch === "arm64" ? "Silicon" : "Intel") : "";

      return {
        id: name,
        shortLabel: `${macLabel ? `${macLabel} ` : archLabel} ${format}`,
        href,
        os,
        arch,
        format,
      } satisfies DownloadOption;
    })
    .filter((option): option is DownloadOption => Boolean(option))
    .sort((a, b) => {
      const osOrder = { windows: 0, macos: 1, linux: 2 };

      if (osOrder[a.os] !== osOrder[b.os]) {
        return osOrder[a.os] - osOrder[b.os];
      }

      if (a.arch !== b.arch) {
        return a.arch === "arm64" ? -1 : 1;
      }

      return a.format.localeCompare(b.format);
    });
}

function getArchLabel(os: DownloadOption["os"], arch: DownloadOption["arch"]): string {
  if (os === "macos") {
    return arch === "arm64" ? "Apple Silicon" : "Intel";
  }

  return arch === "arm64" ? "ARM64" : "x64";
}

function getFormatLabel(format: string): string {
  return format.replace(/^\./, "");
}

function getOsText(os: DownloadOption["os"]): string {
  if (os === "windows") {
    return "Windows";
  }

  if (os === "macos") {
    return "macOS";
  }

  return "Linux";
}

function pickDefaultOption(
  options: DownloadOption[],
  preferred: {
    os: DownloadOption["os"] | null;
    arch: DownloadOption["arch"] | null;
  },
): DownloadOption | null {
  if (options.length === 0) {
    return null;
  }

  return (
    options.find((option) => option.os === preferred.os && option.arch === preferred.arch) ??
    options.find((option) => option.os === preferred.os) ??
    options[0]
  );
}

export function DesktopClient({ downloads }: { downloads: DesktopDownloads }) {
  const t = useExtracted();
  const hasPrerelease = Boolean(downloads.prerelease?.assets.length);
  const [includePrerelease, setIncludePrerelease] = React.useState(false);
  const activeRelease =
    includePrerelease && downloads.prerelease ? downloads.prerelease : downloads.latestRelease;
  const options = React.useMemo(
    () => parseDownloadOptions(activeRelease.assets),
    [activeRelease.assets],
  );
  const [selectedOs, setSelectedOs] = React.useState<DownloadOption["os"] | null>(null);
  const [selectedArch, setSelectedArch] = React.useState<DownloadOption["arch"] | null>(null);
  const [selectedFormat, setSelectedFormat] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hasPrerelease) {
      setIncludePrerelease(false);
    }
  }, [hasPrerelease]);

  React.useEffect(() => {
    const preferred = detectPreferredPlatform();
    const defaultOption = pickDefaultOption(options, preferred);

    if (defaultOption) {
      setSelectedOs(defaultOption.os);
      setSelectedArch(defaultOption.arch);
      setSelectedFormat(defaultOption.format);
      return;
    }

    setSelectedOs(null);
    setSelectedArch(null);
    setSelectedFormat(null);
  }, [options]);

  const osOptions = React.useMemo(
    () => ({
      windows: options.filter((option) => option.os === "windows"),
      macos: options.filter((option) => option.os === "macos"),
      linux: options.filter((option) => option.os === "linux"),
    }),
    [options],
  );
  const currentOs = selectedOs ?? pickDefaultOption(options, detectPreferredPlatform())?.os ?? null;
  const availableArchs = React.useMemo(() => {
    if (!currentOs) {
      return [];
    }

    return Array.from(
      new Set(options.filter((option) => option.os === currentOs).map((option) => option.arch)),
    );
  }, [currentOs, options]);
  const currentArch =
    (selectedArch && availableArchs.includes(selectedArch) ? selectedArch : null) ??
    availableArchs[0] ??
    null;
  const availableFormats = React.useMemo(() => {
    if (!currentOs || !currentArch) {
      return [];
    }

    return options.filter((option) => option.os === currentOs && option.arch === currentArch);
  }, [currentArch, currentOs, options]);
  const currentFormat =
    availableFormats.find((option) => option.format === selectedFormat)?.format ??
    availableFormats[0]?.format ??
    null;
  const selectedOption =
    availableFormats.find((option) => option.format === currentFormat) ??
    pickDefaultOption(options, detectPreferredPlatform()) ??
    null;
  const activeChannelLabel = includePrerelease ? t("Pre-release") : t("Stable");

  return (
    <main className="relative min-h-screen overflow-hidden" id="main-content">
      <section className="relative min-h-[100vh] px-4 pb-20 pt-32 md:pb-32 md:pt-48">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-secondary/70 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur"
            >
              <AppWindowMac className="h-3.5 w-3.5" />
              {t("Desktop Companion")}
            </motion.div>

            <h1 className="mb-8 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl md:text-8xl">
              <BlurReveal className="block" delay={0.2}>
                {t("Deni AI Desktop")}
              </BlurReveal>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-4 block"
              >
                <HighlightedText from="left" delay={1.1} className="px-4 py-1">
                  {t("one click away")}
                </HighlightedText>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="mb-12 max-w-2xl text-xl font-medium leading-relaxed text-muted-foreground md:text-2xl"
            >
              {t(
                "A focused desktop app for quick access, timely alerts, and everyday AI usage without living in a browser tab all day.",
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <Button
                variant="outline"
                size="lg"
                asChild
                className="group transition-all hover:bg-secondary"
              >
                <Link href="#download">
                  <Download className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  {t("Download")}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="group transition-all hover:bg-secondary"
              >
                <Link href="#features">
                  {t("Learn More")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="mt-20 w-full max-w-4xl"
            >
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs text-muted-foreground">
                    {t("Running in tray")}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-border bg-card p-5 text-left">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      {t("Tray")}
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {t(
                        "Keep Deni AI running in your tray so you can open, hide, and return instantly without managing browser tabs.",
                      )}
                    </p>
                    <div className="mt-5 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                      {t("Quick access from the background, whenever you need it.")}
                    </div>
                  </div>

                  <div className="grid gap-4 text-left">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <BellRing className="h-4 w-4 text-muted-foreground" />
                        {t("Native notifications")}
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {t(
                          "Get desktop notifications for replies and important activity so you can respond at the right moment.",
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Feather className="h-4 w-4 text-muted-foreground" />
                        {t("Lightweight")}
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {t(
                          "Designed to stay fast and unobtrusive, with a compact footprint that feels natural to keep open.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="relative bg-secondary/20 px-4 py-24 backdrop-blur md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 text-4xl font-bold tracking-tight md:text-5xl"
            >
              {t("Why Use Deni AI Desktop?")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
            >
              {t(
                "Built for people who want Deni AI available in the background and ready the moment they need it.",
              )}
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={Workflow}
              title={t("Tray")}
              description={t(
                "Keep Deni AI running in your tray so you can open, hide, and return instantly without managing browser tabs.",
              )}
              delay={0.3}
            />
            <FeatureCard
              icon={BellRing}
              title={t("Native notifications")}
              description={t(
                "Get desktop notifications for replies and important activity so you can respond at the right moment.",
              )}
              delay={0.4}
            />
            <FeatureCard
              icon={Feather}
              title={t("Lightweight")}
              description={t(
                "Designed to stay fast and unobtrusive, with a compact footprint that feels natural to keep open.",
              )}
              delay={0.5}
            />
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 text-3xl font-bold tracking-tight md:text-5xl"
            >
              {t("Desktop-first workflow")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
            >
              {t(
                "The experience is tuned for quick reopen, quiet background presence, and faster transitions back into your work.",
              )}
            </motion.p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              label={t("Always ready")}
              title={t("Stay in the tray")}
              body={t("Leave Deni AI available all day and pull it forward only when you need it.")}
              delay={0.2}
            />
            <DetailCard
              label={t("Timely")}
              title={t("See updates immediately")}
              body={t(
                "Native alerts help you notice finished replies and ongoing activity without tab switching.",
              )}
              delay={0.3}
            />
            <DetailCard
              label={t("Calm")}
              title={t("Low-friction presence")}
              body={t(
                "The app stays nearby without feeling heavy, noisy, or distracting during focused work.",
              )}
              delay={0.4}
            />
            <DetailCard
              label={t("Fast return")}
              title={t("Jump back into chat")}
              body={t(
                "Open the desktop app and continue where you left off with less overhead than a full browser workspace.",
              )}
              delay={0.5}
            />
          </div>
        </div>
      </section>

      <section id="download" className="relative px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-[2.5rem] border-2 border-border bg-card/50 p-12 md:p-16 text-center shadow-2xl backdrop-blur-sm"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),transparent)]" />
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-6xl">
              {t("Ready to try Deni AI Desktop?")}
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-muted-foreground">
              {t(
                "Use Deni AI with desktop-native convenience and keep your assistant close without keeping a browser tab open.",
              )}
            </p>
            {options.length > 0 && selectedOption ? (
              <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3">
                <div className="flex w-full flex-col items-stretch justify-center sm:flex-row">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 rounded-b-none rounded-r-none! rounded-t-xl bg-primary px-6 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:rounded-r-none sm:rounded-b-xl sm:rounded-l-xl"
                  >
                    <a href={selectedOption.href} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      {t("Download")} {getOsText(selectedOption.os)}
                    </a>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="lg"
                        variant="default"
                        className="h-12 rounded-t-none rounded-l-none! rounded-b-xl border-0 border-t border-primary-foreground/15 bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:w-14 sm:rounded-l-none sm:rounded-r-xl sm:rounded-b-xl sm:rounded-t-xl sm:border-t-0 sm:border-l"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-2xl border-border/60 bg-background/95 p-3 shadow-2xl backdrop-blur"
                    >
                      {osOptions.macos.length > 0 ? (
                        <DropdownMenuItem
                          className="px-1.5 py-1.5 font-medium"
                          onSelect={() => {
                            setSelectedOs("macos");
                            setSelectedArch(null);
                            setSelectedFormat(null);
                          }}
                        >
                          {t("macOS build")}
                        </DropdownMenuItem>
                      ) : null}
                      {osOptions.macos.length > 0 &&
                      (osOptions.windows.length > 0 || osOptions.linux.length > 0) ? (
                        <DropdownMenuSeparator className="my-2" />
                      ) : null}
                      {osOptions.windows.length > 0 ? (
                        <DropdownMenuItem
                          className="px-1.5 py-1.5 font-medium"
                          onSelect={() => {
                            setSelectedOs("windows");
                            setSelectedArch(null);
                            setSelectedFormat(null);
                          }}
                        >
                          {t("Windows build")}
                        </DropdownMenuItem>
                      ) : null}
                      {osOptions.windows.length > 0 && osOptions.linux.length > 0 ? (
                        <DropdownMenuSeparator className="my-2" />
                      ) : null}
                      {osOptions.linux.length > 0 ? (
                        <DropdownMenuItem
                          className="px-1.5 py-1.5 font-medium"
                          onSelect={() => {
                            setSelectedOs("linux");
                            setSelectedArch(null);
                            setSelectedFormat(null);
                          }}
                        >
                          {t("Linux build")}
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {availableArchs.length > 1 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableArchs.map((arch) => (
                      <button
                        key={arch}
                        type="button"
                        onClick={() => {
                          setSelectedArch(arch);
                          setSelectedFormat(null);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          currentArch === arch
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background/70 text-muted-foreground hover:bg-background"
                        }`}
                      >
                        {getArchLabel(currentOs ?? selectedOption.os, arch)}
                      </button>
                    ))}
                  </div>
                ) : null}
                {availableFormats.length > 1 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableFormats.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedFormat(option.format)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          currentFormat === option.format
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background/70 text-muted-foreground hover:bg-background"
                        }`}
                      >
                        {getFormatLabel(option.format)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <a
                href={downloads.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 underline underline-offset-4 transition-opacity hover:opacity-80"
              >
                <Package className="h-4 w-4" />
                {t("View all releases")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
