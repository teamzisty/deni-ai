import Link from "next/link";
import { useExtracted } from "next-intl";

const Footer = () => {
  const t = useExtracted();

  return (
    <footer className="bg-background text-muted-foreground py-12 px-4">
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("© 2025 Zisty.")}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/legal/terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("Terms")}
          </Link>
          <Link
            href="/legal/privacy-policy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("Privacy")}
          </Link>
          <Link
            href="/legal/tokusho"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("特定商取引法")}
          </Link>
          <Link
            href="/status"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("Status")}
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
