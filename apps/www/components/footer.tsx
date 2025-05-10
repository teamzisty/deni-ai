import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import React, { memo } from "react";
import { cn } from "@workspace/ui/lib/utils";

const Footer = memo(() => {
  const t = useTranslations();
  return (
    <p className="text-xs text-muted-foreground text-center mt-2">
      {t("footer.disclaimer")}
    </p>
  );
});

Footer.displayName = "Footer";

export { Footer };