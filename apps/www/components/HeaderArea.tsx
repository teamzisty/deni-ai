import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { motion } from "framer-motion";
import { memo } from "react";
import { ModelSelector } from "./ModelSelector";
import { ReasoningEffortSelector } from "./ReasoningEffortSelector";
import { Button } from "@repo/ui/components/button";
import { CircleCheck, Moon, StopCircle, Sun } from "lucide-react";
import { EasyTip } from "@/components/easytip";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

interface HeaderAreaProps {
  model: string;
  generating: boolean;
  stop: () => void;
  handleModelChange: (model: string) => void;
  reasoningEffort?: reasoningEffortType;
  handleReasoningEffortChange?: (effort: reasoningEffortType) => void;
}

const MotionButton = motion(Button);

const HeaderArea: React.FC<HeaderAreaProps> = memo(
  ({
    model,
    generating,
    stop,
    handleModelChange,
    reasoningEffort,
    handleReasoningEffortChange,
  }) => {
    const { theme, setTheme } = useTheme();
    const t = useTranslations();

    return (
      <div className="shadow-xl bg-secondary/70 p-2 rounded-full flex items-center justify-center w-fit mx-auto">
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
          {!generating ? (
            <EasyTip content={t("headerArea.ready")}>
              <Button className="rounded-full">
                <CircleCheck />
              </Button>
            </EasyTip>
          ) : (
            <MotionButton
              className="rounded-full transition-opacity duration-200"
              onClick={stop}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <StopCircle />
            </MotionButton>
          )}{" "}
          <EasyTip content={t("headerArea.themeSwitch")}>
            <Button
              className="rounded-full"
              variant={"secondary"}
              onClick={() => {
                { if (theme === "light") { setTheme("dark"); } else { setTheme("light"); } }
              }}
            >
              <motion.div
                animate={{ rotate: theme === "light" ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "light" ? <Moon /> : <Sun />}
              </motion.div>
              {theme === "light" ? t("headerArea.dark") : t("headerArea.light")}
            </Button>
          </EasyTip>{" "}
        </div>
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