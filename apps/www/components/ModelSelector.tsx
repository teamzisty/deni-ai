import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  ImodelDescriptionType,
  modelDescriptionType,
} from "@/lib/modelDescriptions";
import { useTranslations } from "next-intl";
import {
  SiClaude,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Eye,
  Info,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { EasyTip } from "@/components/easytip";
import { useModelVisibility } from "@/hooks/use-model-settings";
import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { DeepSeekIcon } from "./DeepSeekIcon";
import { useSettingsDialog } from "@/context/SettingsDialogContext";
import { Input } from "@workspace/ui/components/input";

const ModelItem = memo(
  ({
    modelDescription,
    visionRequired,
    model,
    handleModelChange,
    t,
    isGridView = false,
    closeDropdown,
  }: {
    modelDescription: ImodelDescriptionType;
    model: string;
    visionRequired?: boolean;
    handleModelChange: (model: string) => void;
    t: any;
    isGridView?: boolean;
    closeDropdown: () => void;
  }) => {
    const disabled = visionRequired && !modelDescription.vision;

    const handleSelect = () => {
      if (!disabled) {
        handleModelChange(model);
        closeDropdown();
      }
    };

    if (isGridView) {
      return (
        <div
          onClick={handleSelect}
          className={cn(
            "flex flex-col h-full p-4 border rounded-lg cursor-pointer hover:bg-accent/50 min-w-[100px] min-h-[100px] relative transition-all duration-200 ease-in-out",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex justify-center mb-2">
            {modelDescription?.type === "ChatGPT" && <SiOpenai size={24} />}
            {modelDescription?.type === "Gemini" && (
              <SiGooglegemini size={24} />
            )}
            {modelDescription?.type === "Claude" && <SiClaude size={24} />}
            {modelDescription?.type === "Grok" && <SiX size={24} />}
            {modelDescription?.type === "DeepSeek" && (
              <DeepSeekIcon size={24} />
            )}
          </div>
          <div className="text-center text-base font-medium mb-1">
            {modelDescription.displayName}
          </div>
          <div className="flex justify-center mt-2 gap-1 flex-wrap mt-auto">
            {modelDescription?.fast && (
              <EasyTip content={t("modelSelector.fast")}>
                <Badge className="p-1" variant="secondary">
                  <Zap size="14" />
                </Badge>
              </EasyTip>
            )}

            {modelDescription?.vision && (
              <EasyTip content={t("modelSelector.visionCapable")}>
                <Badge className="p-1" variant="secondary">
                  <Eye size="14" />
                </Badge>
              </EasyTip>
            )}

            {modelDescription?.reasoning && (
              <EasyTip content={t("modelSelector.reasoning")}>
                <Badge className="p-1" variant="secondary">
                  <BrainCircuit size="14" />
                </Badge>
              </EasyTip>
            )}
          </div>
        </div>
      );
    }

    return (
      <DropdownMenuItem
        disabled={disabled}
        className="w-full cursor-pointer transition-all duration-200 ease-in-out"
        onClick={handleSelect}
      >
        {modelDescription?.type === "ChatGPT" && <SiOpenai />}
        {modelDescription?.type === "Gemini" && <SiGooglegemini />}
        {modelDescription?.type === "Claude" && <SiClaude />}
        {modelDescription?.type === "Grok" && <SiX />}
        {modelDescription?.type === "DeepSeek" && <DeepSeekIcon />}
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{modelDescription.displayName}</span>
            <EasyTip content={t(`modelDescriptions.${model.replace(".", "-")}`)}>
              <Info size={16} />
            </EasyTip>
          </div>
          <div className="flex items-center gap-2">
            {modelDescription?.fast && (
              <EasyTip content={t("modelSelector.fast")}>
                <Badge className="p-1" variant="secondary">
                  <Zap size="16" />
                </Badge>
              </EasyTip>
            )}

            {modelDescription?.vision && (
              <EasyTip content={t("modelSelector.visionCapable")}>
                <Badge className="p-1" variant="secondary">
                  <Eye size="16" />
                </Badge>
              </EasyTip>
            )}

            {modelDescription?.reasoning && (
              <EasyTip content={t("modelSelector.reasoning")}>
                <Badge className="p-1" variant="secondary">
                  <BrainCircuit size="16" />
                </Badge>
              </EasyTip>
            )}
          </div>
        </div>
      </DropdownMenuItem>
    );
  }
);
ModelItem.displayName = "ModelItem";

export const ModelSelector = memo(function ModelSelector({
  modelDescriptions,
  model,
  visionRequired,
  handleModelChange,
  refreshIcon,
}: {
  modelDescriptions: modelDescriptionType;
  model: string;
  visionRequired?: boolean;
  refreshIcon?: boolean;
  handleModelChange: (model: string) => void;
}) {
  const { visibility } = useModelVisibility();
  const t = useTranslations();
  const { openDialog } = useSettingsDialog();
  const [isGridView, setIsGridView] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const ModelIcon = useMemo(() => {
    if (refreshIcon) return <RefreshCw />;
    switch (modelDescriptions[model]?.type) {
      case "ChatGPT":
        return <SiOpenai />;
      case "Gemini":
        return <SiGooglegemini />;
      case "Claude":
        return <SiClaude />;
      case "Grok":
        return <SiX />;
      case "DeepSeek":
        return <DeepSeekIcon />;
      default:
        return null;
    }
  }, [refreshIcon, model, modelDescriptions]);

  const filteredModels = useMemo(() => {
    const visibleModels = Object.keys(modelDescriptions)
      .filter((modelKey) => {
        const isVisible = isGridView || visibility[modelKey];
        if (!isVisible) return false;

        // Filter based on search query
        if (searchQuery && searchQuery.length > 0) {
          const modelName =
            modelDescriptions[modelKey]?.displayName?.toLowerCase() || "";
          const modelType =
            modelDescriptions[modelKey]?.type?.toLowerCase() || "";
          return (
            modelName.includes(searchQuery.toLowerCase()) ||
            modelType.includes(searchQuery.toLowerCase())
          );
        }

        return true;
      })
      .map((modelKey) => ({
        key: modelKey,
        description: modelDescriptions[modelKey] as ImodelDescriptionType,
      }));

    // Sort models by type and name for better organization
    return visibleModels.sort((a, b) => {
      if (a.description.type !== b.description.type) {
        return a.description.type.localeCompare(b.description.type);
      }
      return a.description.displayName.localeCompare(b.description.displayName);
    });
  }, [modelDescriptions, visibility, searchQuery, isGridView]);

  const memoizedHandleModelChange = useCallback(handleModelChange, [
    handleModelChange,
  ]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleGridView = useCallback((showGrid: boolean) => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsGridView(showGrid);
      // setTimeout to allow the new content to render before animating in
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 200);
  }, []);

  const handleShowAllModels = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleGridView(true);
    },
    [toggleGridView]
  );

  const handleShowVisibleModels = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleGridView(false);
    },
    [toggleGridView]
  );

  const handleManageModels = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      closeDropdown();
      openDialog("model");
    },
    [closeDropdown, openDialog]
  );

  // Apply fade-in animation when content changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = isAnimating ? "0" : "1";
      contentRef.current.style.transform = isAnimating
        ? "translateY(10px)"
        : "translateY(0)";
    }
  }, [isAnimating]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="m-0" asChild>
        <Button
          ref={triggerRef}
          variant={refreshIcon ? "ghost" : "secondary"}
          className={cn("p-2 rounded-full", refreshIcon && "!p-1")}
        >
          {ModelIcon}
          <span className="inline-flex items-center justify-center">
            {modelDescriptions[model]?.displayName}{" "}
          </span>
          <ArrowDown className="text-zinc-400 text-sm" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "w-96",
          isGridView &&
            "sm:w-[500px] md:w-[600px] lg:w-[700px] w-[300px] max-w-[95vw]"
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="pb-0">
          {t("modelSelector.model")}
        </DropdownMenuLabel>

        {visionRequired && (
          <div className="ml-2">
            <span className="text-sm text-muted-foreground">
              {t("modelSelector.visionRequired")}
            </span>
          </div>
        )}

        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("modelSelector.searchModels")}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isGridView && (
          <div className="px-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleShowVisibleModels}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("modelSelector.manageModels")}
            </Button>
          </div>
        )}

        <div
          ref={contentRef}
          className="transition-all duration-200 ease-in-out"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "translateY(10px)" : "translateY(0)",
          }}
        >
          <DropdownMenuGroup>
            {isGridView ? (
              <div className="p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredModels.map((model) => (
                    <EasyTip
                      content={t(`modelDescriptions.${model.key.replace(".", "-")}`)}
                      key={model.key}
                    >
                      <ModelItem
                        model={model.key}
                        modelDescription={
                          modelDescriptions[model.key] as ImodelDescriptionType
                        }
                        visionRequired={visionRequired}
                        handleModelChange={memoizedHandleModelChange}
                        t={t}
                        isGridView={true}
                        closeDropdown={closeDropdown}
                      />
                    </EasyTip>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {filteredModels.map((model) => (
                  <ModelItem
                    key={model.key}
                    model={model.key}
                    modelDescription={
                      modelDescriptions[model.key] as ImodelDescriptionType
                    }
                    visionRequired={visionRequired}
                    handleModelChange={memoizedHandleModelChange}
                    t={t}
                    closeDropdown={closeDropdown}
                  />
                ))}

                {!refreshIcon && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleShowAllModels}>
                      {t("modelSelector.showAllModels")}
                      <ArrowRight className="ml-auto" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleManageModels}>
                      {t("modelSelector.manageModels")}
                      <ArrowRight className="ml-auto" />
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
