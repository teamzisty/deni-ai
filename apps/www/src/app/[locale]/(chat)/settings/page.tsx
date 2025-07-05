"use client";

import { useEffect } from "react";
import { useSettingsDialog } from "@/context/settings-dialog-context";

export default function SettingsPage() {
  const { openDialog } = useSettingsDialog();

  useEffect(() => {
    // Open the settings dialog when this page loads
    openDialog("general");
  }, [openDialog]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">
            The settings dialog should open automatically.
          </p>
        </div>
      </div>
    </div>
  );
}