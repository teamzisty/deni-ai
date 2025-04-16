import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { memo } from "react";
import { ModelSelector } from "./ModelSelector";
import { ReasoningEffortSelector } from "./ReasoningEffortSelector";
import { Button } from "@repo/ui/components/button";
import { Settings } from "lucide-react";
import { EasyTip } from "@/components/easytip";
import { useSettingsDialog } from "@/context/SettingsDialogContext";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

interface HeaderAreaProps {
  model: string;
  generating: boolean;
  stop: () => void;
  handleModelChange: (model: string) => void;
  reasoningEffort?: reasoningEffortType;
  handleReasoningEffortChange?: (effort: reasoningEffortType) => void;
  rightContent?: React.ReactNode;
}

const HeaderArea: React.FC<HeaderAreaProps> = memo(
  ({
    model,
    generating,
    stop,
    handleModelChange,
    reasoningEffort,
    handleReasoningEffortChange,
    rightContent,
  }) => {
    const { theme, setTheme } = useTheme();
    const t = useTranslations();
    const { openDialog } = useSettingsDialog();

    return (
      <div className="shadow-xl bg-secondary/70 p-2 rounded-full flex items-center justify-between w-fit mx-auto">
        <div className="flex gap-1 items-center">
          <ModelSelector
            handleModelChange={handleModelChange}
            model={model}
            modelDescriptions={modelDescriptions}
          />
          {reasoningEffort &&
            handleReasoningEffortChange &&
            modelDescriptions[model]?.reasoning && (
              <ReasoningEffortSelector
                model={model}
                reasoningEffort={reasoningEffort}
                handleReasoningEffortChange={handleReasoningEffortChange}
                availableEfforts={modelDescriptions[model]?.reasoningEffort}
              />
            )}
          <EasyTip content={t("settings.title")}>
            <Button
              className="rounded-full"
              variant={"secondary"}
              onClick={() => openDialog()}
            >
              <Settings />
              {t("settings.title")}
            </Button>
          </EasyTip>
        </div>
        {rightContent}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.model === nextProps.model &&
      prevProps.generating === nextProps.generating &&
      prevProps.reasoningEffort === nextProps.reasoningEffort &&
      prevProps.handleModelChange === nextProps.handleModelChange
    );
  }
);
HeaderArea.displayName = "HeaderArea";

export default HeaderArea;