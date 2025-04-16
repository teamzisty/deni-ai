"use client";

import React from "react";
import { useSettingsDialog } from "@/context/SettingsDialogContext";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { User, Paintbrush, X, Bot, Database, MenuIcon } from "lucide-react";
import GeneralSettings from "./GeneralSettings";
import AccountSettings from "./AccountSettings";
import ModelSettings from "./ModelSettings";
import DataControlsSettings from "./DataControlsSettings";
import { Button } from "@workspace/ui/components/button";
export function SettingsDialog() {
  const { isOpen, closeDialog, dialogType } = useSettingsDialog();
  const t = useTranslations();
  const isMobile = useIsMobile();

  // 初期タブを設定
  const initialTab = dialogType || "model";

  // 設定コンテンツのコンポーネント
  const SettingsContent = () => (
    <div className="flex flex-col gap-5">
      <Tabs defaultValue={initialTab} className="w-full">
        <div className="flex flex-col md:flex-row w-full h-full gap-4">
          <TabsList className="flex md:flex-col md:items-start mt-15 gap-2 bg-transparent">
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary"
              value="general"
            >
              <MenuIcon className="md:mr-2" />
              <span className="hidden md:inline">
                {t("settings.general.tab")}
              </span>
            </TabsTrigger>
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
            <TabsContent value="general" className="h-full">
              <GeneralSettings />
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

  // モバイル表示の場合はドロワーを使用
  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && closeDialog()}
        direction="bottom"
      >
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="border-b p-4 flex items-center flex-row justify-between">
            <DrawerTitle>{t("settings.title")}</DrawerTitle>
            <DrawerClose asChild>
              <button className="p-1 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <div className="p-4 overflow-auto">
            <SettingsContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // デスクトップ表示の場合はダイアログを使用
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="[&>button]:hidden rounded-3xl h-[80vh] md:h-[70vh] overflow-hidden md:w-[calc(100%-2rem)] !max-w-3xl">
        <DialogTitle>{t("settings.title")}</DialogTitle>
        <div className="!h-fit !p-0 !mb-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDialog}
            className="absolute right-4 top-4"
          >
            <X />
          </Button>{" "}
        </div>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  );
}
