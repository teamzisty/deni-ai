"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CanvasContextType {
  isCanvasOpen: boolean;
  canvasContent: string;
  openCanvas: (content?: string) => void;
  closeCanvas: () => void;
  updateCanvasContent: (content: string) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasContent, setCanvasContent] = useState("");

  const openCanvas = (content?: string) => {
    if (content) {
      setCanvasContent(content);
    }
    setIsCanvasOpen(true);
  };

  const closeCanvas = () => {
    setIsCanvasOpen(false);
  };

  const updateCanvasContent = (content: string) => {
    setCanvasContent(content);
  };

  return (
    <CanvasContext.Provider
      value={{
        isCanvasOpen,
        canvasContent,
        openCanvas,
        closeCanvas,
        updateCanvasContent,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}