import { useState, useEffect } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";

export type ModelVisibility = {
  [modelId: string]: boolean;
};

const getInitialVisibility = (): ModelVisibility => {
  // localStorageに保存された設定があれば利用、なければ全モデルを表示(true)とする
  const stored = localStorage.getItem("modelVisibility");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error parsing modelVisibility from localStorage", error);
    }
  }
  const initial: ModelVisibility = {};
  Object.keys(modelDescriptions).forEach((id) => {
    initial[id] = true;
  });
  return initial;
};

export const useModelVisibility = () => {
  const [visibility, setVisibility] = useState<ModelVisibility>({});

  useEffect(() => {
    const initial = getInitialVisibility();
    setVisibility(initial);
  }, []);

  const setModelVisibility = (modelId: string, isVisible: boolean) => {
    setVisibility((prev) => {
      const newVisibility = {
        ...prev,
        [modelId]: isVisible,
      };
      localStorage.setItem("modelVisibility", JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  const toggleModelVisibility = (modelId: string) => {
    setModelVisibility(modelId, !visibility[modelId]);
  };

  return { visibility, setModelVisibility, toggleModelVisibility };
};