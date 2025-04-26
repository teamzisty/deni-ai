import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { memo } from "react";
import { ModelSelector } from "./ModelSelector";
import { ReasoningEffortSelector } from "./ReasoningEffortSelector";
import { Button } from "@workspace/ui/components/button";
import { Settings } from "lucide-react";
import { EasyTip } from "@/components/easytip";
import { useSettingsDialog } from "@/context/SettingsDialogContext";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import ShareButton from "./ShareButton";
import { ChatSession } from "@/hooks/use-chat-sessions";
import { User } from "firebase/auth";

interface HeaderAreaProps {
  model: string;
  generating: boolean;
  stop: () => void;
  handleModelChange: (model: string) => void;
  reasoningEffort?: reasoningEffortType;
  handleReasoningEffortChange?: (effort: reasoningEffortType) => void;
  currentSession?: ChatSession;
  user: User;
  messages: any[];
  chatId: string;
}

const HeaderArea: React.FC<HeaderAreaProps> = memo(
  ({
    model,
    handleModelChange,
    reasoningEffort,
    handleReasoningEffortChange,
    currentSession,
    user,
    messages,
  }) => {
    const isMobile = useIsMobile();
    const t = useTranslations();
    const { openDialog } = useSettingsDialog();

    return (
      <div
        className={cn(
          "shadow-xl bg-secondary/70 rounded-full flex items-center justify-between mx-auto",
          isMobile ? "p-1 px-2 gap-0.5" : "p-2 w-fit"
        )}
      >
        <div
          className={cn("flex items-center", isMobile ? "gap-0.5" : "gap-1")}
        >
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
              className={cn("rounded-full", isMobile && "px-2 py-1")}
              variant={"secondary"}
              onClick={() => openDialog()}
            >
              <Settings size={isMobile ? 18 : 24} />
              {!isMobile && t("settings.title")}
            </Button>
          </EasyTip>
          {currentSession && (
            <ShareButton
              currentSession={currentSession}
              user={user}
              messages={messages}
            />
          )}
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
