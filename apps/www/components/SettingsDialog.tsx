"use client";

import React from "react";
import { useSettingsDialog } from "@/context/SettingsDialogContext";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { User, Paintbrush, X, Bot, Database } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import AppearanceSettings from "./ApperanceSettings";
import AccountSettings from "./AccountSettings";
import ModelSettings from "./ModelSettings";
import DataControlsSettings from "./DataControlsSettings";
export function SettingsDialog() {
  const { isOpen, closeDialog, dialogType } = useSettingsDialog();
  const t = useTranslations();
  const isMobile = useIsMobile();

  // 初期タブを設定
  const initialTab = dialogType || "model";

  // 設定コンテンツのコンポーネント
  const SettingsContent = () => (
    <div className="flex flex-col gap-5">
      <div className="!h-fit !p-0 !mb-0">
        <div className="text-lg leading-none font-semibold">
          {t("settings.title")}
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDialog}
            className="absolute right-4 top-4"
          >
            <X />
          </Button>{" "}
        </div>
      </div>
      <Tabs defaultValue={initialTab} className="w-full">
        <div className="flex flex-col md:flex-row w-full h-full gap-4">
          <TabsList className="flex md:flex-col md:items-start mt-15 gap-2 bg-transparent">
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary"
              value="account"
            >
              <User className="md:mr-2" />
              <span className="hidden md:inline">
                {t("settings.account.tab")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary"
              value="appearance"
            >
              <Paintbrush className="md:mr-2" />
              <span className="hidden md:inline">
                {t("settings.appearance.tab")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary"
              value="model"
            >
              <Bot className="md:mr-2" />
              <span className="hidden md:inline">
                {t("settings.model.tab")}
              </span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary"
              value="dataControls"
            >
              <Database className="md:mr-2" />
              <span className="hidden md:inline">
                {t("settings.dataControls.tab")}
              </span>
            </TabsTrigger>

          </TabsList>

          <div className="flex-1 overflow-y-auto h-[calc(80vh-120px)] md:h-[calc(70vh-120px)]">
            <TabsContent value="account" className="h-full">
              <AccountSettings />
            </TabsContent>
            <TabsContent value="appearance" className="h-full">
              <AppearanceSettings />
            </TabsContent>
            <TabsContent value="model" className="h-full">
              <ModelSettings />
            </TabsContent>
            <TabsContent value="dataControls" className="h-full">
              <DataControlsSettings />
            </TabsContent>
          </div>
        </div>
      </Tabs>{" "}
    </div>
  );

  // モバイル表示の場合はポップオーバーを使用
  if (isMobile) {
    return (
      <Popover open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <PopoverTrigger className="hidden">Open Settings</PopoverTrigger>
        <PopoverContent className="h-[90vh] w-screen overflow-hidden">
          <SettingsContent />
        </PopoverContent>
      </Popover>
    );
  }

  // デスクトップ表示の場合はダイアログを使用
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="[&>button]:hidden rounded-3xl h-[80vh] md:h-[70vh] overflow-hidden md:w-[calc(100%-2rem)] !max-w-3xl">
        <DialogTitle className="sr-only">設定</DialogTitle>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  );
}
