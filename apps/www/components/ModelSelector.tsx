import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
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
  ArrowRight,
  Ban,
  BrainCircuit,
  Eye,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { EasyTip } from "@/components/easytip";
import { Link } from "@/i18n/navigation";
import { useModelVisibility } from "@/hooks/use-model-settings";
import { memo, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DeepSeekIcon } from "./DeepSeekIcon";

const ModelItem = memo(
  ({
    modelDescription,
    visionRequired,
    model,
    handleModelChange,
    t,
  }: {
    modelDescription: ImodelDescriptionType;
    model: string;
    visionRequired?: boolean;
    handleModelChange: (model: string) => void;
    t: any;
  }) => {
    return (
      <DropdownMenuItem
        disabled={
          modelDescription.offline ||
          (visionRequired && !modelDescription.vision)
        }
        className="w-full cursor-pointer"
        onClick={() => handleModelChange(model)}
      >
        {modelDescription?.type === "ChatGPT" && <SiOpenai />}
        {modelDescription?.type === "Gemini" && <SiGooglegemini />}
        {modelDescription?.type === "Claude" && <SiClaude />}
        {modelDescription?.type === "Grok" && <SiX />}
        {modelDescription?.type === "DeepSeek" && <DeepSeekIcon />}
        <div className="flex items-center w-full justify-between">
          <span className="text-base">{modelDescription.displayName}</span>
          <div className="flex items-center gap-2">
            {modelDescription?.offline && (
              <EasyTip content={t("modelSelector.offline")}>
                <Badge variant="destructive" className="p-1 flex gap-1">
                  <Ban size="16" />
                </Badge>
              </EasyTip>
            )}

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
    return Object.keys(modelDescriptions)
      .filter((modelKey) => visibility[modelKey])
      .map((modelKey) => ({
        key: modelKey,
        description: modelDescriptions[modelKey] as ImodelDescriptionType,
      }));
  }, [modelDescriptions, visibility]);

  const memoizedHandleModelChange = useCallback(handleModelChange, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="m-0" asChild>
        <Button
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

      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="pb-0!">
          {t("modelSelector.model")}
        </DropdownMenuLabel>
        {visionRequired && (
          <div className="ml-2">
            <span className="text-sm text-muted-foreground">
              {t("modelSelector.visionRequired")}
            </span>
          </div>
        )}
        <DropdownMenuGroup>
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
            />
          ))}
          {!refreshIcon && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div className="flex items-center justify-between w-full">
                  <Link href={"/settings/model"}>
                    {t("modelSelector.manageModels")}
                  </Link>
                  <ArrowRight />
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
