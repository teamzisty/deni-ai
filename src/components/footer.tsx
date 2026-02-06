import Link from "next/link";
import { useExtracted } from "next-intl";
import DeniAIIcon from "./deni-ai-icon";

const Footer = () => {
  const t = useExtracted();

  return (
    <footer className="relative bg-card/50 border-t border-border/40">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <DeniAIIcon className="w-8 h-8 text-primary" />
            <div>
              <span className="font-semibold tracking-tight">Deni AI</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("AI for Everyone")}
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="/flixa"
              className="text-muted-foreground transition-colors hover:text-foreground editorial-underline"
            >
              Flixa
            </Link>
            <Link
              href="/legal/terms"
              className="text-muted-foreground transition-colors hover:text-foreground editorial-underline"
            >
              {t("Terms")}
            </Link>
            <Link
              href="/legal/privacy-policy"
              className="text-muted-foreground transition-colors hover:text-foreground editorial-underline"
            >
              {t("Privacy")}
            </Link>
            <Link
              href="/legal/tokusho"
              className="text-muted-foreground transition-colors hover:text-foreground editorial-underline"
            >
              {t("特定商取引法")}
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            {t("© 2025 Zisty. All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
