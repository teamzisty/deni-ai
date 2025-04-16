"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { toast } from "sonner";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>{t("error.title")}</CardTitle>
          <CardDescription>
            {t("error.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="leading-none font-bold">{t("error.commonCauses")}</p>
          <Accordion type="single" collapsible>
            <AccordionItem value="try-again">
              <AccordionTrigger>{t("error.tryAgain.title")}</AccordionTrigger>
              <AccordionContent>
                {t("error.tryAgain.content")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="chat-session-old">
              <AccordionTrigger>{t("error.oldChatSession.title")}</AccordionTrigger>
              <AccordionContent>
                {t("error.oldChatSession.content")}
                <br /> <br />
                {t("error.oldChatSession.solution")}
                <br />
                <span className="text-muted-foreground text-xs">
                  {t("error.oldChatSession.warning")}
                </span>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="old-cache">
              <AccordionTrigger>{t("error.oldCache.title")}</AccordionTrigger>
              <AccordionContent>
                {t("error.oldCache.content")}
                <br /> <br />
                {t("error.oldCache.solution")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="other-errors">
              <AccordionTrigger>{t("error.otherErrors.title")}</AccordionTrigger>
              <AccordionContent>
                {t("error.otherErrors.content")}{" "}
                <br /> <br />
                <ol className="list-decimal list-inside">
                  <li>{t("error.otherErrors.steps.step1")}</li>
                  <li>{t("error.otherErrors.steps.step2")}</li>
                  <li>{t("error.otherErrors.steps.step3")}</li>
                  <li>{t("error.otherErrors.steps.step4")}</li>
                </ol>
                {t("error.otherErrors.conclusion")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="gap-3">
          <Button onClick={reset}>{t("error.tryAgainButton")}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"secondary"}>{t("error.debugMenu")}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <span className="ml-2 text-muted-foreground text-xs">
                {t("error.reportToDeveloper")}
              </span>
              <DropdownMenuItem onClick={() => setIsErrorOpen(true)}>
                {t("error.checkError")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <span className="ml-2 text-muted-foreground text-xs">
                {t("error.dangerousActions")}
              </span>
              <DropdownMenuItem onClick={() => window.localStorage.clear()}>{t("error.deleteSession")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isErrorOpen}
        onOpenChange={() => setIsErrorOpen(!isErrorOpen)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("error.checkErrorTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("error.checkErrorDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea
              value={String(error)}
              readOnly
              onClick={(e) => {
                e.currentTarget.select();
                navigator.clipboard.writeText(
                  String(error) || "Failed to get error"
                );
                toast.success(t("error.copied"));
              }}
            />
          </div>{" "}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("error.close")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
