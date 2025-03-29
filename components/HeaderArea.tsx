import { modelDescriptions } from "@/lib/modelDescriptions";
import { motion } from "framer-motion";
import { memo } from "react";
import { ModelSelector } from "./ModelSelector";
import { Button } from "@/components/ui/button";
import { CircleCheck, Moon, StopCircle, Sun } from "lucide-react";
import { EasyTip } from "@/components/easytip";
import { useTheme } from "next-themes";

interface HeaderAreaProps {
  model: string;
  generating: boolean;
  stop: () => void;
  handleModelChange: (model: string) => void;
}

const MotionButton = motion.create(Button);

const HeaderArea: React.FC<HeaderAreaProps> = memo(
  ({ model, generating, stop, handleModelChange }) => {
    const { theme, setTheme } = useTheme();

    return (
      <div className="shadow-xl bg-secondary/70 p-2 rounded-full flex items-center justify-center w-fit mx-auto">
        <div className="flex gap-1 items-center">
          <ModelSelector
            handleModelChange={handleModelChange}
            model={model}
            modelDescriptions={modelDescriptions}
          />
          {!generating ? (
            <EasyTip content="準備完了">
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
          <EasyTip content="テーマ切り替え">
            <Button
              className="rounded-full"
              variant={"secondary"}
              onClick={() => {
                theme === "light" ? setTheme("dark") : setTheme("light");
              }}
            >
              <motion.div
                animate={{ rotate: theme === "light" ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "light" ? <Moon /> : <Sun />}
              </motion.div>
              {theme === "light" ? "ダーク" : "ライト"}
            </Button>
          </EasyTip>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.generating === nextProps.generating &&
      prevProps.model === nextProps.model
    );
  }
);
HeaderArea.displayName = "HeaderArea";

export default HeaderArea;
