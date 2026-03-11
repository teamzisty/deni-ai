"use client";

import { SiAnthropic, SiGooglegemini, SiX } from "@icons-pack/react-simple-icons";
import type { ChatStatus } from "ai";
import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  ArrowBigUpDash,
  Bot,
  BrainCircuit,
  BrainIcon,
  ChevronDownIcon,
  Code,
  Film,
  Gem,
  Globe,
  Image as ImageIcon,
  Plug,
  SearchIcon,
  Sparkle,
  StarIcon,
  XIcon,
} from "lucide-react";
import { useExtracted } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input";
import { Composer, type ComposerMessage } from "@/components/chat/composer";
import Openai from "@/components/openai";
import { useAvailableModels } from "@/hooks/use-available-models";
import { models } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

function getModelDescription(value: string, t: (key: string) => string): string {
  switch (value) {
    case "gpt-5.4":
    case "gpt-5.2":
      return t("General purpose OpenAI model");
    case "gpt-5.2-codex":
    case "gpt-5.1-codex":
      return t("For complex coding tasks");
    case "gpt-5.1-codex-mini":
      return t("For quick coding tasks");
    case "openai/gpt-oss-120b":
      return t("Most powerful open-weight model");
    case "openai/gpt-oss-20b":
      return t("Medium-sized open-weight model");
    case "gemini-3.1-pro-preview":
    case "gemini-3-pro-preview":
      return t("Best for complex tasks");
    case "gemini-3-flash-preview":
      return t("Best for everyday tasks");
    case "gemini-3.1-flash-lite-preview":
    case "gemini-2.5-flash-lite":
      return t("Best for high volume tasks");
    case "claude-sonnet-4.5":
    case "claude-sonnet-4.6":
    case "claude-sonnet-4":
      return t("Hybrid reasoning model");
    case "claude-opus-4.5":
    case "claude-opus-4.1":
    case "claude-opus-4":
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
}

function getFeatureLabel(feature: string, t: (key: string) => string): string {
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
}

function ModelIcon({
  model,
  className,
}: {
  model: Pick<ModelOption, "author" | "premium">;
  className?: string;
}) {
  if (model.premium) return <Gem className={cn("size-3.5", className)} aria-hidden="true" />;
  switch (model.author) {
    case "openai":
      return <Openai aria-hidden="true" />;
    case "anthropic":
      return <SiAnthropic className={cn("size-3.5", className)} aria-hidden="true" />;
    case "google":
      return <SiGooglegemini className={cn("size-3.5", className)} aria-hidden="true" />;
    case "xai":
      return <SiX className={cn("size-3.5", className)} aria-hidden="true" />;
    case "openai_compatible":
      return <Plug className={cn("size-3.5", className)} aria-hidden="true" />;
    default:
      return <Bot className={cn("size-3.5", className)} aria-hidden="true" />;
  }
}

function ProviderIcon({ author }: { author: string }) {
  switch (author) {
    case "featured":
      return <Sparkle className="size-3.5" aria-hidden="true" />;
    case "openai":
      return <Openai aria-hidden="true" />;
    case "anthropic":
      return <SiAnthropic className="size-3.5" aria-hidden="true" />;
    case "google":
      return <SiGooglegemini className="size-3.5" aria-hidden="true" />;
    case "xai":
      return <SiX className="size-3.5" aria-hidden="true" />;
    case "openai_compatible":
      return <Plug className="size-3.5" aria-hidden="true" />;
    default:
      return <Bot className="size-3.5" aria-hidden="true" />;
  }
}

function getProviderLabel(author: string, t: (key: string) => string): string {
  switch (author) {
    case "featured":
      return t("Featured");
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google";
    case "xai":
      return "xAI";
    case "openai_compatible":
      return t("Custom");
    default:
      return author;
  }
}

function ModelPickerItem({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useExtracted();
  const description =
    "description" in model ? model.description : getModelDescription(model.value, t);
  const highlightFeatures = model.features.filter((f) => f.includes("est"));
  const regularFeatures = model.features.filter((f) => !f.includes("est"));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex flex-col gap-1 rounded-md p-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected ? "bg-accent/70 text-accent-foreground" : "text-foreground hover:bg-accent/40",
      )}
    >
      <span className="flex items-center gap-1.5 font-medium text-sm leading-none flex-wrap">
        <span className="shrink-0 flex items-center [&_svg]:size-3.5">
          <ModelIcon model={model} />
        </span>
        <span>{model.name}</span>
        {model.author === "openai_compatible" && (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-[10px] leading-none px-1 py-0.5 h-auto"
          >
            {t("BYOK")}
          </Badge>
        )}
        {highlightFeatures.map((feature) => (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-[10px] leading-none px-1 py-0.5 h-auto"
            key={feature}
          >
            <StarIcon
              className="size-3 text-yellow-500 dark:fill-yellow-400 mr-0.5"
              aria-hidden="true"
            />
            {getFeatureLabel(feature, t)}
          </Badge>
        ))}
      </span>

      {description && (
        <span className="text-xs text-muted-foreground leading-snug pl-5">{description}</span>
      )}

      {regularFeatures.length > 0 && (
        <span className="flex gap-1 flex-wrap pl-5">
          {regularFeatures.map((feature) => (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-[10px] leading-none px-1 py-0.5 h-auto"
              key={feature}
            >
              {(() => {
                switch (feature) {
                  case "smart":
                    return <Sparkle className="size-3 mr-0.5" aria-hidden="true" />;
                  case "reasoning":
                    return <BrainCircuit className="size-3 mr-0.5" aria-hidden="true" />;
                  case "fast":
                    return <ArrowBigUpDash className="size-3 mr-0.5" aria-hidden="true" />;
                  case "coding":
                    return <Code className="size-3 mr-0.5" aria-hidden="true" />;
                  default:
                    return null;
                }
              })()}
              {getFeatureLabel(feature, t)}
            </Badge>
          ))}
        </span>
      )}
    </button>
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
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("featured");
  const [legacyModelsOpen, setLegacyModelsOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");

  const selectedModel = availableModels.find((m) => m.value === model);
  const supportsReasoningEffort = selectedModel?.features?.includes("reasoning");

  // Group available models by author/provider, with "featured" prepended
  const providerGroups = useMemo(() => {
    const groups: Record<string, ModelOption[]> = {};

    // Featured virtual category first
    const featuredModels = availableModels.filter((m) => "featured" in m && m.featured === true);
    if (featuredModels.length > 0) {
      groups["featured"] = featuredModels;
    }

    // Then group by author
    for (const m of availableModels) {
      const key = m.author ?? "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return groups;
  }, [availableModels]);

  const normalizedModelQuery = modelQuery.trim().toLowerCase();

  const filteredProviderGroups = useMemo(() => {
    if (!normalizedModelQuery) {
      return providerGroups;
    }

    return Object.fromEntries(
      Object.entries(providerGroups).flatMap(([provider, entries]) => {
        const filteredEntries = entries.filter((entry) => {
          const description =
            "description" in entry ? entry.description : getModelDescription(entry.value, t);
          const haystack = [
            entry.name,
            entry.value,
            entry.author,
            provider,
            description,
            ...entry.features,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedModelQuery);
        });

        return filteredEntries.length > 0 ? [[provider, filteredEntries]] : [];
      }),
    ) as Record<string, ModelOption[]>;
  }, [normalizedModelQuery, providerGroups, t]);

  const availableProviders = useMemo(
    () => Object.keys(filteredProviderGroups),
    [filteredProviderGroups],
  );
  const currentProviderModels = filteredProviderGroups[selectedProvider] ?? [];
  const activeModels = currentProviderModels.filter((entry) => entry.default !== false);
  const legacyModels = currentProviderModels.filter((entry) => entry.default === false);

  useEffect(() => {
    if (availableProviders.length === 0) {
      return;
    }

    if (!availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0]);
    }
  }, [availableProviders, selectedProvider]);

  const handleModelPopoverOpenChange = (open: boolean) => {
    if (open) {
      setModelQuery("");
      setLegacyModelsOpen(false);
      // Default to featured, or fall back to the current model's provider
      const isFeatured =
        selectedModel && "featured" in selectedModel && selectedModel.featured === true;
      setSelectedProvider(
        isFeatured || providerGroups["featured"] ? "featured" : (selectedModel?.author ?? "openai"),
      );
    }
    setModelPopoverOpen(open);
  };

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

          {/* Two-panel model selector */}
          <Popover open={modelPopoverOpen} onOpenChange={handleModelPopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto gap-1.5 border-none bg-transparent px-2 py-1.5 font-medium text-muted-foreground shadow-none transition-colors",
                  "hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground",
                )}
              >
                <span className="flex items-center [&_svg]:size-3.5">
                  <ModelIcon model={selectedModel ?? { author: "openai", premium: false }} />
                </span>
                <span className="max-w-30 truncate text-sm">
                  {selectedModel?.name ?? t("Select model")}
                </span>
                {showByokBadge && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-[10px] leading-none px-1 py-0.5 h-auto"
                  >
                    {t("BYOK")}
                  </Badge>
                )}
                <ChevronDownIcon className="size-3 opacity-50 shrink-0" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-125 p-0 shadow-lg" side="top" align="start" sideOffset={8}>
              <div className="flex flex-col rounded-[inherit]">
                <div className="border-b">
                  <div className="relative">
                    <SearchIcon
                      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      value={modelQuery}
                      onChange={(event) => setModelQuery(event.target.value)}
                      placeholder={t("Search")}
                      aria-label={t("Search")}
                      className="pl-8 rounded-b-none"
                    />
                  </div>
                </div>
                <div className="flex h-95 overflow-hidden">
                  {/* Left panel: Provider list */}
                  <div className="w-35 shrink-0 border-r flex flex-col gap-0.5 p-1.5 overflow-y-auto bg-muted/30">
                    {availableProviders.map((provider) => {
                      const count = filteredProviderGroups[provider]?.length ?? 0;
                      const isActive = selectedProvider === provider;
                      return (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setSelectedProvider(provider)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-background text-foreground font-medium shadow-sm"
                              : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                            provider === "featured" &&
                              isActive &&
                              "text-yellow-600 dark:text-yellow-400",
                            provider === "featured" &&
                              !isActive &&
                              "hover:text-yellow-600 dark:hover:text-yellow-400",
                          )}
                        >
                          <span className="shrink-0 flex items-center [&_svg]:size-3.5">
                            <ProviderIcon author={provider} />
                          </span>
                          <span className="flex-1 truncate leading-none">
                            {getProviderLabel(provider, t)}
                          </span>
                          <span className="tabular-nums text-xs opacity-50 shrink-0">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right panel: Model list */}
                  <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                    {currentProviderModels.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t("No models available")}
                      </p>
                    ) : (
                      <>
                        {activeModels.map((m) => (
                          <ModelPickerItem
                            key={m.value}
                            model={m}
                            isSelected={m.value === model}
                            onSelect={() => {
                              onModelChange(m.value);
                              setModelPopoverOpen(false);
                            }}
                          />
                        ))}

                        {legacyModels.length > 0 && (
                          <Collapsible open={legacyModelsOpen} onOpenChange={setLegacyModelsOpen}>
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <ArchiveIcon className="size-4 shrink-0" aria-hidden="true" />
                                <span className="flex-1">
                                  {t(
                                    "{count, plural, one {# legacy model} other {# legacy models}}",
                                    {
                                      count: legacyModels.length,
                                    },
                                  )}
                                </span>
                                <ChevronDownIcon
                                  className={cn(
                                    "size-4 shrink-0 transition-transform",
                                    legacyModelsOpen && "rotate-180",
                                  )}
                                  aria-hidden="true"
                                />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1 flex flex-col gap-0.5">
                              {legacyModels.map((m) => (
                                <ModelPickerItem
                                  key={m.value}
                                  model={m}
                                  isSelected={m.value === model}
                                  onSelect={() => {
                                    onModelChange(m.value);
                                    setModelPopoverOpen(false);
                                  }}
                                />
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden md:block">{renderReasoningEffortSelector()}</div>
        </>
      }
    />
  );
}
