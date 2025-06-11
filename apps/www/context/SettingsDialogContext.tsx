"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

type SettingsDialogContextType = {
  isOpen: boolean;
  openDialog: (type?: string) => void;
  closeDialog: () => void;
  dialogType: string | null;
};

const SettingsDialogContext = createContext<
  SettingsDialogContextType | undefined
>(undefined);

export const SettingsDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogType, setDialogType] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLのクエリパラメータからダイアログの状態を取得
  useEffect(() => {
    const settingsParam = searchParams.get("settings");
    if (settingsParam) {
      setIsOpen(true);
      setDialogType(settingsParam);
    } else {
      setIsOpen(false);
      setDialogType(null);
    }
  }, [searchParams]);

  // ダイアログを開く
  const openDialog = (type: string = "general") => {
    // 現在のURLパラメータを維持しながら、settingsパラメータを追加
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("settings", type);

    // URLを更新（ページ遷移なし）
    router.replace(`${pathname}?${params.toString()}`);
  };

  // ダイアログを閉じる
  const closeDialog = () => {
    // settingsパラメータを削除
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("settings");

    // URLを更新（ページ遷移なし）
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
  };

  return (
    <SettingsDialogContext.Provider
      value={{ isOpen, openDialog, closeDialog, dialogType }}
    >
      {children}
    </SettingsDialogContext.Provider>
  );
};

export const useSettingsDialog = () => {
  const context = useContext(SettingsDialogContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsDialog must be used within a SettingsDialogProvider",
    );
  }
  return context;
};
