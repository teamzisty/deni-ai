"use client";

import { SiAnthropic, SiGooglegemini, SiOpenai, SiX } from "@icons-pack/react-simple-icons";
import type { ChatStatus } from "ai";
import type { LucideIcon } from "lucide-react";
import {
  ArrowBigUpDash,
  Bot,
  BrainCircuit,
  BrainIcon,
  Code,
  Film,
  Gem,
  Globe,
  Image as ImageIcon,
  Plug,
  Sparkle,
  StarIcon,
  XIcon,
} from "lucide-react";
import { useExtracted } from "next-intl";
import {
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input";
import { Composer, type ComposerMessage } from "@/components/chat/composer";
import { useAvailableModels } from "@/hooks/use-available-models";
import { models } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export type { ComposerMessage };

const reasoningEffortValues = ["low", "medium", "high"] as const;
export type ReasoningEffort = (typeof reasoningEffortValues)[number];

export function isReasoningEffort(value: string): value is ReasoningEffort {
  return (reasoningEffortValues as readonly string[]).includes(value);
}

type BaseModelOption = (typeof models)[number];
type CustomModelOption = {
  name: string;
  value: string;
  description: string;
  author: "openai_compatible";
  features: string[];
  premium?: boolean;
  default?: boolean;
  source: "custom";
};
export type ModelOption = BaseModelOption | CustomModelOption;

type ToolChipProps = {
  icon: LucideIcon;
  label: string;
  onRemove: () => void;
};

function ToolChip({ icon: Icon, label, onRemove }: ToolChipProps) {
  const t = useExtracted();

  return (
    <Button
      variant="ghost"
      className="group flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={onRemove}
      aria-label={t("Remove {label}", { label })}
    >
      <Icon className="size-3.5 group-hover:hidden" aria-hidden="true" />
      <XIcon className="size-3.5 hidden group-hover:block" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}

function ModelItem({ model, isSelected }: { model: ModelOption; isSelected: boolean }) {
  const t = useExtracted();

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "reasoning":
        return t("Reasoning");
      case "smart":
        return t("Smart");
      case "fast":
        return t("Fast");
      case "coding":
        return t("Coding");
      case "fastest":
        return t("Fastest");
      case "smartest":
        return t("Smartest");
      default:
        return feature;
    }
  };

  const getModelDescription = (value: string) => {
    switch (value) {
      case "gpt-5.2":
        return t("General purpose OpenAI model");
      case "gpt-5.3-codex":
      case "gpt-5.1-codex":
        return t("For complex coding tasks");
      case "gpt-5.1-codex-mini":
        return t("For quick coding tasks");
      case "openai/gpt-oss-120b":
        return t("Most powerful open-weight model");
      case "openai/gpt-oss-20b":
        return t("Medium-sized open-weight model");
      case "gemini-3-pro-preview":
        return t("Best for complex tasks");
      case "gemini-3-flash-preview":
        return t("Best for everyday tasks");
      case "gemini-2.5-flash-lite":
        return t("Best for high volume tasks");
      case "claude-sonnet-4.5":
        return t("Hybrid reasoning model");
      case "claude-opus-4.5":
      case "claude-opus-4.1":
        return t("Legacy professional model");
      case "claude-opus-4.6":
        return t("All-around professional model");
      case "grok-4-0709":
        return t("xAI's most intelligent model");
      case "grok-4-1-fast-reasoning":
      case "grok-4-1-fast-non-reasoning":
        return t("Fast and efficient model");
      default:
        return value;
    }
  };

  const modelDescription =
    "description" in model ? model.description : getModelDescription(model.value);

  return (
    <PromptInputSelectItem
      key={model.value}
      value={model.value}
      textValue={model.name}
      className={cn("items-start p-2 [&>span]:w-full", isSelected && "bg-accent/60")}
    >
      <span className="flex flex-col w-full gap-1">
        <span className="flex items-center justify-between font-medium">
          <span className="flex items-center gap-1">
            {(() => {
              if (model.premium) {
                return <Gem className="size-4" aria-hidden="true" />;
              }

              switch (model?.author) {
                case "openai":
                  return <SiOpenai aria-hidden="true" />;
                case "anthropic":
                  return <SiAnthropic aria-hidden="true" />;
                case "google":
                  return <SiGooglegemini aria-hidden="true" />;
                case "xai":
                  return <SiX aria-hidden="true" />;
                case "openai_compatible":
                  return <Plug className="size-4" aria-hidden="true" />;
                default:
                  return <Bot aria-hidden="true" />;
              }
            })()}
            {model.name}
            {model.author === "openai_compatible" && (
              <Badge variant="secondary" className="bg-primary/10">
                {t("BYOK")}
              </Badge>
            )}
            {model.features
              .filter((feature) => feature.includes("est"))
              .map((feature) => (
                <Badge variant="secondary" className="bg-primary/10" key={feature}>
                  <StarIcon
                    className="size-4 text-yellow-500 dark:fill-yellow-400"
                    aria-hidden="true"
                  />
                  {getFeatureLabel(feature)}
                </Badge>
              ))}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">{modelDescription}</span>
        {model.features.length > 0 && (
          <span className="flex gap-1 flex-wrap">
            {model.features
              .filter((feature) => !feature.includes("est"))
              .map((feature) => (
                <Badge variant="secondary" className="bg-primary/10" key={feature}>
                  {(() => {
                    switch (feature) {
                      case "smart":
                        return <Sparkle aria-hidden="true" />;
                      case "reasoning":
                        return <BrainCircuit aria-hidden="true" />;
                      case "fast":
                        return <ArrowBigUpDash aria-hidden="true" />;
                      case "coding":
                        return <Code aria-hidden="true" />;
                    }
                  })()}
                  {getFeatureLabel(feature)}
                </Badge>
              ))}
          </span>
        )}
      </span>
    </PromptInputSelectItem>
  );
}

export interface ChatComposerProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (
    message: ComposerMessage,
    options: {
      model: string;
      webSearch: boolean;
      videoMode: boolean;
      imageMode: boolean;
      reasoningEffort: ReasoningEffort;
    },
  ) => void;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
  status?: ChatStatus;
  isSubmitDisabled?: boolean;
  model: string;
  onModelChange: (model: string) => void;
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  videoMode: boolean;
  onVideoModeChange: (enabled: boolean) => void;
  imageMode: boolean;
  onImageModeChange: (enabled: boolean) => void;
  reasoningEffort: ReasoningEffort;
  onReasoningEffortChange: (effort: ReasoningEffort) => void;
  showByokBadge?: boolean;
}

export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  onStop,
  placeholder,
  className,
  status,
  isSubmitDisabled,
  model,
  onModelChange,
  webSearch,
  onWebSearchChange,
  videoMode,
  onVideoModeChange,
  imageMode,
  onImageModeChange,
  reasoningEffort,
  onReasoningEffortChange,
  showByokBadge = false,
}: ChatComposerProps) {
  const t = useExtracted();
  const { availableModels } = useAvailableModels();

  const selectedModel = availableModels.find((m) => m.value === model);
  const supportsReasoningEffort = selectedModel?.features?.includes("reasoning");

  const reasoningEffortLabel = (() => {
    switch (reasoningEffort) {
      case "low":
        return t("Low");
      case "medium":
        return t("Medium");
      case "high":
        return t("High");
      default:
        return reasoningEffort;
    }
  })();

  const handleVideoToggle = (enabled: boolean) => {
    onVideoModeChange(enabled);
    if (enabled) {
      onWebSearchChange(false);
      onImageModeChange(false);
    }
  };

  const handleImageToggle = (enabled: boolean) => {
    onImageModeChange(enabled);
    if (enabled) {
      onWebSearchChange(false);
      onVideoModeChange(false);
    }
  };

  const handleSearchToggle = (enabled: boolean) => {
    onWebSearchChange(enabled);
    if (enabled) {
      onVideoModeChange(false);
      onImageModeChange(false);
    }
  };

  const handleSubmit = (message: ComposerMessage) => {
    onSubmit(message, {
      model,
      webSearch,
      videoMode,
      imageMode,
      reasoningEffort,
    });
  };

  const renderReasoningEffortSelector = (triggerClassName?: string) => (
    <PromptInputSelect
      value={reasoningEffort}
      onValueChange={(value) => {
        if (isReasoningEffort(value)) {
          onReasoningEffortChange(value);
        }
      }}
      disabled={!supportsReasoningEffort}
    >
      <PromptInputSelectTrigger className={cn(triggerClassName)}>
        <PromptInputSelectValue>
          <BrainIcon className="size-4" aria-hidden="true" />
          {reasoningEffortLabel}
        </PromptInputSelectValue>
      </PromptInputSelectTrigger>
      <PromptInputSelectContent>
        <PromptInputSelectItem value="low">{t("Low")}</PromptInputSelectItem>
        <PromptInputSelectItem value="medium">{t("Medium")}</PromptInputSelectItem>
        <PromptInputSelectItem value="high">{t("High")}</PromptInputSelectItem>
      </PromptInputSelectContent>
    </PromptInputSelect>
  );

  const goodModels = availableModels.filter(
    (m) => m.value !== model && m.features?.filter((f) => f.includes("est")).length,
  );
  const defaultModels = availableModels.filter(
    (m) =>
      m.value !== model &&
      m.default !== false &&
      m.features?.filter((f) => f.includes("est")).length === 0,
  );
  const otherModels = availableModels.filter((m) => m.value !== model && m.default === false);

  const resolvedPlaceholder =
    placeholder ??
    (videoMode
      ? t("Describe the video scene, style, motion, and lighting.")
      : imageMode
        ? t("Describe the image you want to generate.")
        : undefined);

  return (
    <Composer
      onSubmit={handleSubmit}
      onStop={onStop}
      className={className}
      globalDrop
      multiple
      placeholder={resolvedPlaceholder}
      headerClassName="py-0.5!"
      value={value}
      onValueChange={onValueChange}
      status={status}
      isSubmitDisabled={isSubmitDisabled}
      actionMenuItems={
        <>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={videoMode}
            onCheckedChange={(checked) => handleVideoToggle(Boolean(checked))}
          >
            <Film className="size-4" aria-hidden="true" />
            {t("Video")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={imageMode}
            onCheckedChange={(checked) => handleImageToggle(Boolean(checked))}
          >
            <ImageIcon className="size-4" aria-hidden="true" />
            {t("Image")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={webSearch}
            onCheckedChange={(checked) => handleSearchToggle(Boolean(checked))}
          >
            <Globe className="size-4" aria-hidden="true" />
            {t("Search")}
          </DropdownMenuCheckboxItem>
          <div className="px-2 py-1.5 md:hidden">
            {renderReasoningEffortSelector("w-full justify-between")}
          </div>
        </>
      }
      tools={
        <>
          {videoMode && (
            <ToolChip icon={Film} label={t("Video")} onRemove={() => handleVideoToggle(false)} />
          )}
          {imageMode && (
            <ToolChip
              icon={ImageIcon}
              label={t("Image")}
              onRemove={() => handleImageToggle(false)}
            />
          )}
          {webSearch && (
            <ToolChip icon={Globe} label={t("Search")} onRemove={() => handleSearchToggle(false)} />
          )}
          <PromptInputSelect
            onValueChange={(value) => {
              onModelChange(value);
            }}
            value={model}
          >
            <PromptInputSelectTrigger>
              <PromptInputSelectValue>
                {(() => {
                  if (selectedModel?.premium) {
                    return <Gem className="size-4" aria-hidden="true" />;
                  }

                  switch (selectedModel?.author) {
                    case "openai":
                      return <SiOpenai aria-hidden="true" />;
                    case "anthropic":
                      return <SiAnthropic aria-hidden="true" />;
                    case "google":
                      return <SiGooglegemini aria-hidden="true" />;
                    case "xai":
                      return <SiX aria-hidden="true" />;
                    case "openai_compatible":
                      return <Plug className="size-4" aria-hidden="true" />;
                    default:
                      return <Bot aria-hidden="true" />;
                  }
                })()}
                {selectedModel?.name ?? t("Select model")}
                {showByokBadge && (
                  <Badge variant="secondary" className="bg-primary/10">
                    {t("BYOK")}
                  </Badge>
                )}
              </PromptInputSelectValue>
            </PromptInputSelectTrigger>
            <PromptInputSelectContent className="max-h-[300px] md:max-h-[400px] overflow-y-auto">
              {selectedModel && <ModelItem model={selectedModel} isSelected={true} />}
              <Separator className="my-1" />
              {goodModels.map((m) => (
                <ModelItem key={m.value} model={m} isSelected={false} />
              ))}
              <Separator className="my-1" />
              {defaultModels.map((m) => (
                <ModelItem key={m.value} model={m} isSelected={false} />
              ))}
              {otherModels.length > 0 && <Separator className="my-1" />}
              {otherModels.map((m) => (
                <ModelItem key={m.value} model={m} isSelected={false} />
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
          <div className="hidden md:block">{renderReasoningEffortSelector()}</div>
        </>
      }
    />
  );
}
