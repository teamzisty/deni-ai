"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

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

  // Open dialog
  const openDialog = (type: string = "general") => {
    setIsOpen(true);
    setDialogType(type);
  };

  // Close dialog
  const closeDialog = () => {
    setIsOpen(false);
    setDialogType(null);
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