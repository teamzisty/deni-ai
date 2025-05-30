"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { setCookie } from 'cookies-next';
import { useTranslations } from "next-intl";

interface UpdateAlertProps {
  open: boolean;
}

export function UpdateAlert({ open }: UpdateAlertProps) {
  const t = useTranslations();

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setCookie("update_alert", "false", { path: "/" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("layout.updateAlert.title")}</DialogTitle>
          <DialogDescription>{t("layout.updateAlert.description")}</DialogDescription>
        </DialogHeader>        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button asChild>
            <a href="https://canary.deniai.app/home">{t("layout.updateAlert.button")}</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateAlert;
