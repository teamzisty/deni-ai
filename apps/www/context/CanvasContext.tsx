"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

type CanvasData = {
  content: string;
  title: string;
};

interface CanvasContextType {
  getCanvasData: (sessionId: string) => CanvasData | null;
  updateCanvas: (sessionId: string, data: CanvasData) => void;
  clearCanvas: (sessionId: string) => void;
  clearAllCanvas: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  // キャンバスデータをセッションIDごとに保存するマップ
  const [canvasDataMap, setCanvasDataMap] = useState<
    Record<string, CanvasData>
  >({});

  const getCanvasData = useCallback(
    (sessionId: string) => {
      return canvasDataMap[sessionId] || null;
    },
    [canvasDataMap],
  );

  const updateCanvas = useCallback((sessionId: string, data: CanvasData) => {
    setCanvasDataMap((prev) => ({
      ...prev,
      [sessionId]: data,
    }));
  }, []);

  const clearCanvas = useCallback((sessionId: string) => {
    setCanvasDataMap((prev) => {
      const newMap = { ...prev };
      delete newMap[sessionId];
      return newMap;
    });
  }, []);

  const clearAllCanvas = useCallback(() => {
    setCanvasDataMap({});
  }, []);

  return (
    <CanvasContext.Provider
      value={{ getCanvasData, updateCanvas, clearCanvas, clearAllCanvas }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
};
