import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import React, { memo } from "react";
import { cn } from "@repo/ui/lib/utils";

const Footer = memo(() => {
  const t = useTranslations();
  return (
    <p className={cn("text-xs text-center text-zinc-500 mt-2")}>
      {t("footer.disclaimer")}
      <br />
      <small>
        <Link
          target="_blank"
          href="https://voids.top/"
          className="hover:text-blue-500 transition-colors"
        >
          {t("footer.poweredBy")}
        </Link>{" "}
        {t("footer.and")}{" "}
        <Link
          target="_blank"
          href="https://vercel.com/"
          className="hover:text-blue-500 transition-colors"
        >
          Vercel
        </Link>
      </small>
    </p>
  );
});

Footer.displayName = "Footer";

export { Footer };