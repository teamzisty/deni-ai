import { useTranslations } from "next-intl";
import React, { memo } from "react";
import { Link } from "@/i18n/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { buildInfo } from "@/lib/version";

const Footer = memo(() => {
  const t = useTranslations();

  return (
    <footer className="bg-black border-t border-neutral-800 text-white py-16 relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-10 md:gap-20 mb-16">
          {/* Logo and Description */}
          <div className="md:w-1/3">
            <Link href="/" className="text-xl font-bold block mb-4">
              Deni AI
            </Link>
            <p className="text-neutral-400 text-sm mb-6 max-w-sm">
              {t("footer.disclaimer")}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/raicdev/deni-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <SiGithub className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/deniaiapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <SiX className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-20">
            {/* Products Section */}
            <div>
              <h3 className="text-sm font-medium mb-4 text-white">
                {t("footer.pages")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/home"
                    className="text-neutral-400 text-sm hover:text-white transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dev"
                    className="text-neutral-400 text-sm hover:text-white transition-colors"
                  >
                    Dev Mode
                  </Link>
                </li>
                <li>
                  <Link
                    href="/hubs"
                    className="text-neutral-400 text-sm hover:text-white transition-colors"
                  >
                    Hubs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div>
              <h3 className="text-sm font-medium mb-4 text-white">
                {t("footer.resources.title")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://docs.deniai.app"
                    target="_blank"
                    className="text-neutral-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    Docs <ExternalLinkIcon size={14} />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-neutral-400 text-sm hover:text-white transition-colors"
                  >
                    {t("footer.resources.privacyPolicy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-neutral-400 text-sm hover:text-white transition-colors"
                  >
                    {t("footer.resources.termsOfService")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/raicdev/deni-ai"
                    target="_blank"
                    className="text-neutral-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    {t("footer.resources.sourceCode")}{" "}
                    <ExternalLinkIcon size={14} />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Team Section */}
            <div>
              <h3 className="text-sm font-medium mb-4 text-white">
                {t("footer.team.title")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://zephyrus.tech"
                    target="_blank"
                    className="text-neutral-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    {t("footer.team.website")} <ExternalLinkIcon size={14} />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://zephyrus.tech/blog"
                    target="_blank"
                    className="text-neutral-400 text-sm hover:text-white transition-colors"
                  >
                    {t("footer.team.blog")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://patreon.com/uplauncherteam"
                    target="_blank"
                    className="text-neutral-400 text-sm hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    {t("footer.resources.donate")} <ExternalLinkIcon size={14} />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-6 border-t border-neutral-800 text-center md:text-left md:flex md:justify-between md:items-center">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} UpLauncher Team. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500 mt-2 md:mt-0">
            v{buildInfo.version}
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export { Footer };
