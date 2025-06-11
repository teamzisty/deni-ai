import { useState, useEffect } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";

export type ModelVisibility = {
  [modelId: string]: boolean;
};

const getInitialVisibility = (): ModelVisibility => {
  // localStorageに保存された設定があれば利用、なければdefaultVisibility: trueのモデルのみ表示する
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
    initial[id] = modelDescriptions[id]?.defaultVisibility ?? false;
  });
  return initial;
};

export const useModelVisibility = () => {
  const [visibility, setVisibility] = useState<ModelVisibility>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initial = getInitialVisibility();
    setVisibility(initial);
    setIsLoading(false);
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

  return { visibility, isLoading, setModelVisibility, toggleModelVisibility };
};
