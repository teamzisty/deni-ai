"use client";

import React, { Suspense } from "react";
import { useSettingsDialog } from "@/context/settings-dialog-context";
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
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { User, X, Bot, Database, MenuIcon, Settings2 } from "lucide-react";
import GeneralSettings from "./general-settings";
import AccountSettings from "./account/AccountSettings";
import ModelSettings from "./model-settings";
import DataControlsSettings from "./data-controls-settings";
import { Button } from "@workspace/ui/components/button";
import CustomizeSettings from "./customize-settings";
import { Loading } from "./loading";
import { useTranslations } from "@/hooks/use-translations";

export function SettingsDialog() {
  const { isOpen, closeDialog, dialogType } = useSettingsDialog();
  const t = useTranslations("settings");
  const isMobile = useIsMobile();

  // Initial tab setting
  const initialTab = dialogType || "model";

  // Settings content component
  const SettingsContent = () => (
    <div className="flex flex-col gap-5">
      <Tabs defaultValue={initialTab} className="w-full">
        <div className="flex flex-col md:flex-row w-full h-full gap-4">
          <TabsList className="flex md:flex-col md:items-start sm:mt-15 gap-2 bg-transparent">
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="general"
            >
              <MenuIcon className="md:mr-2" />
              <span className="hidden md:inline">{t("tabs.general")}</span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="account"
            >
              <User className="md:mr-2" />
              <span className="hidden md:inline">{t("tabs.account")}</span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="customize"
            >
              <Settings2 className="md:mr-2" />
              <span className="hidden md:inline">{t("tabs.customize")}</span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="model"
            >
              <Bot className="md:mr-2" />
              <span className="hidden md:inline">{t("tabs.models")}</span>
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 justify-start w-full p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="dataControls"
            >
              <Database className="md:mr-2" />
              <span className="hidden md:inline">{t("tabs.dataControls")}</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto h-[calc(80vh-120px)] md:h-[calc(70vh-120px)]">
            <TabsContent value="account" className="h-full">
              <AccountSettings />
            </TabsContent>
            <TabsContent value="general" className="h-full">
              <GeneralSettings />
            </TabsContent>
            <TabsContent value="customize" className="h-full">
              <CustomizeSettings />
            </TabsContent>
            <TabsContent value="model" className="h-full">
              <Suspense fallback={<Loading />}>
                <ModelSettings />
              </Suspense>
            </TabsContent>
            <TabsContent value="dataControls" className="h-full">
              <DataControlsSettings />
            </TabsContent>
          </div>
        </div>
      </Tabs>{" "}
    </div>
  );

  // Use drawer for mobile display
  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && closeDialog()}
        direction="bottom"
      >
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="border-b p-4 flex items-center flex-row justify-between">
            <DrawerTitle>{t("title")}</DrawerTitle>
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

  // Use dialog for desktop display
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="[&>button]:hidden rounded-3xl h-[80vh] md:h-[70vh] overflow-hidden md:w-[calc(100%-2rem)] !max-w-3xl">
        <DialogTitle>{t("title")}</DialogTitle>
        <div className="!h-fit !p-0 !mb-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDialog}
            className="absolute right-4 top-4"
          >
            <X />
          </Button>
        </div>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  );
}
