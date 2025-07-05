import { SiX } from "@icons-pack/react-simple-icons";
import { Button } from "@workspace/ui/components/button";
import { Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("contact");
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("email.title")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("email.description")}
            </p>
            <a
              href={`mailto:${t("email.address")}`}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Mail className="h-4 w-4" />
              {t("email.address")}
            </a>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <SiX className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("x.title")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("x.description")}
            </p>
            <a
              href={`https://x.com/${t("x.handle").substring(1)}`}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <SiX className="h-4 w-4" />
              {t("x.handle")}
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          {t("responseTime")}
        </p>
      </div>

      <div className="text-center mt-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t("partnership.title")}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t("partnership.description")}
        </p>

        <Button asChild>
          <Link href="/more/partners">{t("partnership.learnMore")}</Link>
        </Button>
      </div>
    </div>
  );
}