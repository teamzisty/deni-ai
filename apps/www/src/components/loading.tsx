"use client";

import { RefreshCw } from "lucide-react";

export function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}