"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t("checkUrl")}</p>
        </CardContent>
        <CardFooter className="gap-3">
          <Button asChild>
            <Link href="/">{t("chatButton")}</Link>
          </Button>
          <Button variant={"secondary"} onClick={() => window.history.back()}>
            {t("backButton")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
