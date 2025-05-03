import { Button } from "@workspace/ui/components/button";
import {
  Telescope,
  ChevronDown,
  Zap,
  Check,
  PackageSearch,
} from "lucide-react";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { EasyTip } from "./easytip";
import { cn } from "@workspace/ui/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Command,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@workspace/ui/components/command";
import { motion, AnimatePresence } from "framer-motion";

export type ResearchDepth = "none" | "shallow" | "deep" | "advanced";

interface DeepResearchButtonProps {
  deepResearch: boolean;
  researchDepth: ResearchDepth;
  disabled: boolean;
  deepResearchToggle: () => void;
  onResearchDepthChange: (depth: ResearchDepth) => void;
  devMode?: boolean;
}

export const DeepResearchButton = memo(
  ({
    deepResearch,
    researchDepth,
    deepResearchToggle,
    onResearchDepthChange,
    disabled,
    devMode,
  }: DeepResearchButtonProps) => {
    const t = useTranslations();
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);

    const handleDepthChange = (depth: ResearchDepth) => {
      onResearchDepthChange(depth);
      setIsOpen(false);
    };

    return (
      <div className="flex items-center">
        <EasyTip
          content={
            devMode
              ? t("chatInput.devNotAvailable")
              : t("chat.deepResearch.tooltip") || "Use Deep Research"
          }
        >
          <Button
            variant={deepResearch ? "default" : "outline"}
            disabled={devMode || disabled}
            className={cn(
              "rounded-l-full mr-0 transition-all duration-200",
              deepResearch ? "rounded-r-none" : "rounded-full"
            )}
            size={isMobile ? "sm" : "default"}
            onClick={deepResearchToggle}
          >
            {researchDepth === "shallow" ? <Zap /> : researchDepth === "advanced" ? <PackageSearch /> : <Telescope />}
            {researchDepth === "shallow"
              ? t("chatInput.shallowResearch")
              : researchDepth === "advanced"
              ? t("chatInput.advancedResearch")
              : t("chatInput.deepResearch")}
          </Button>
        </EasyTip>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <AnimatePresence>
            {deepResearch && (
              <PopoverTrigger asChild>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant={deepResearch ? "default" : "outline"}
                    className="rounded-l-none rounded-r-full ml-0 px-2"
                    size={isMobile ? "sm" : "default"}
                    disabled={devMode || disabled}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </motion.div>
              </PopoverTrigger>
            )}
          </AnimatePresence>
          <PopoverContent className="w-56 p-0" align="end">
            <Command>
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleDepthChange("shallow")}
                    value="shallow"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1 items-center">
                        <Zap />
                        <span className="font-medium text-base">
                          {t("chat.deepResearch.shallow") || "Shallow Research"}
                        </span>
                      </div>
                      <span>
                        {t("chat.deepResearch.shallowDescription") ||
                          "Shallow Research"}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto",
                        researchDepth === "shallow"
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  <CommandItem
                    onSelect={() => handleDepthChange("deep")}
                    value="deep"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1 items-center">
                        <Telescope />
                        <span className="font-medium text-base">
                          {t("chat.deepResearch.deep") || "Deep Research"}
                        </span>
                      </div>
                      <span>
                        {t("chat.deepResearch.deepDescription") ||
                          "Deep Research"}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto",
                        researchDepth === "deep" ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  <CommandItem
                    onSelect={() => handleDepthChange("advanced")}
                    value="advanced"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1 items-center">
                        <PackageSearch />
                        <span className="font-medium text-base">
                          {t("chat.deepResearch.advanced") || "Advanced Research"}
                        </span>
                      </div>
                      <span>
                        {t("chat.deepResearch.advancedDescription") ||
                          "Advanced Research"}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto",
                        researchDepth === "advanced"
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DeepResearchButton.displayName = "DeepResearchButton";
