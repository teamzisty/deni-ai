import { models } from "@/lib/constants";
import { UseChatHelpers } from "@ai-sdk/react";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import {
  CircleQuestionMark,
  Upload,
  Presentation,
  Globe,
  Telescope,
  X,
  Zap,
  CheckIcon,
  Forward,
  ImageIcon,
  BrainCircuit,
  FlaskConical,
  Gem,
} from "lucide-react";
import { researchModeMapping } from "./input";
import {
  SiAnthropic,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import React, { useCallback, useEffect, useState } from "react";
import DeepSeekIcon from "../deepseek-icon";
import { Tip } from "../tooltip";
import { Badge } from "@workspace/ui/components/badge";

export interface InputActionsProps {
  model?: string;
  setModel?: (model: string) => void;
  canvas?: boolean;
  setCanvas?: (canvas: boolean) => void;
  search?: boolean;
  setSearch?: (search: boolean) => void;
  researchMode?: "disabled" | "shallow" | "deep" | "deeper";
  setResearchMode?: (mode: "disabled" | "shallow" | "deep" | "deeper") => void;
  handleSubmit: UseChatHelpers["handleSubmit"];
  input: UseChatHelpers["input"];
  thinkingEffort?: "disabled" | "low" | "medium" | "high";
  setThinkingEffort?: (effort: "disabled" | "low" | "medium" | "high") => void;
}

export function UploadButton() {
  return (
    <Button type="button" variant="ghost" size="icon" className="rounded-full">
      <Upload className="h-5 w-5" />
    </Button>
  );
}

export function CanvasButton({
  canvas,
  setCanvas,
}: {
  canvas: boolean;
  setCanvas: (canvas: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant={canvas ? "secondary" : "ghost"}
      onClick={() => setCanvas(!canvas)}
      className="rounded-full"
    >
      <Presentation className="h-5 w-5" />
      Canvas
    </Button>
  );
}

export function SearchButton({
  search,
  setSearch,
}: {
  search: boolean;
  setSearch: (search: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant={search ? "secondary" : "ghost"}
      onClick={() => setSearch(!search)}
      className="rounded-full"
    >
      <Globe className="h-5 w-5" />
      Search
    </Button>
  );
}

export function ThinkingButton({
  thinking,
  setThinking,
}: {
  thinking: boolean;
  setThinking: (thinking: boolean) => void;
}) {
  return (
    <Tip content="Respond before thinking" side="top">
      <Button
        type="button"
        variant={thinking ? "secondary" : "ghost"}
        onClick={() => setThinking(!thinking)}
        className="rounded-full"
      >
        <BrainCircuit className="h-5 w-5" />
      </Button>
    </Tip>
  );
}

export function ThinkingEffortButton({
  model,
  thinkingEffort,
  setThinkingEffort,
}: {
  model: string;
  thinkingEffort: "disabled" | "low" | "medium" | "high";
  setThinkingEffort: (effort: "disabled" | "low" | "medium" | "high") => void;
}) {
  const effortMapping: Record<"disabled" | "low" | "medium" | "high", string> =
    {
      disabled: "Off",
      low: "Low",
      medium: "Medium",
      high: "High",
    };

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "rounded-full",
            !models[model]?.reasoning_efforts && "hidden",
          )}
        >
          <BrainCircuit className="h-5 w-5" />
          {effortMapping[thinkingEffort]}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {models[model]?.reasoning_efforts?.map((effort) => (
                <CommandItem
                  key={effort}
                  value={effort}
                  onSelect={(value) => {
                    setThinkingEffort(
                      value as "disabled" | "low" | "medium" | "high",
                    );
                    setOpen(false);
                  }}
                >
                  {thinkingEffort === effort ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <BrainCircuit className="h-4 w-4" />
                  )}
                  {
                    effortMapping[
                      effort as "disabled" | "low" | "medium" | "high"
                    ]
                  }
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ResearchModeButton({
  search,
  researchMode,
  setResearchMode,
}: {
  search: boolean;
  researchMode: "disabled" | "shallow" | "deep" | "deeper";
  setResearchMode: (mode: "disabled" | "shallow" | "deep" | "deeper") => void;
}) {
  const [open, setOpen] = useState(false);

  const handleResearchModeSelect = useCallback(
    (value: string) => {
      setResearchMode(value as "disabled" | "shallow" | "deep" | "deeper");
      setOpen(false);
    },
    [setResearchMode],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={!search}
          type="button"
          variant={researchMode !== "disabled" ? "secondary" : "ghost"}
          className="rounded-full"
        >
          <Telescope className="h-5 w-5" />
          Research{" "}
          <Badge className={cn(researchMode === "disabled" && "hidden")}>
            {researchModeMapping[researchMode]}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {[
                {
                  value: "disabled",
                  label: researchModeMapping.disabled,
                  icon: <X className={cn("mr-2 h-4 w-4")} />,
                  description: "Disable research mode",
                },
                {
                  value: "shallow",
                  label: researchModeMapping.shallow,
                  icon: <Zap className={cn("mr-2 h-4 w-4")} />,
                  description: "Get faster responses",
                },
                {
                  value: "deep",
                  label: researchModeMapping.deep,
                  icon: <Telescope className={cn("mr-2 h-4 w-4")} />,
                  description: "Get detailed responses",
                },
                {
                  value: "deeper",
                  label: researchModeMapping.deeper,
                  icon: <Telescope className={cn("mr-2 h-4 w-4")} />,
                  description: "Get advanced responses",
                },
              ].map((mode) => (
                <CommandItem
                  className="flex-col items-start"
                  key={mode.value}
                  value={mode.value}
                  onSelect={handleResearchModeSelect}
                >
                  <div className="flex items-center">
                    {researchMode === mode.value ? (
                      <CheckIcon className={cn("mr-2 h-4 w-4")} />
                    ) : (
                      mode.icon
                    )}
                    {mode.label}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {mode.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ModelSelector({
  model,
  setModel,
}: {
  model: string;
  setModel: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-row gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="rounded-full">
            {(() => {
              switch (models[model]?.author) {
                case "OpenAI":
                  return <SiOpenai className="h-4 w-4" />;
                case "Anthropic":
                  return <SiAnthropic className="h-4 w-4" />;
                case "Google":
                  return <SiGooglegemini className="h-4 w-4" />;
                case "xAI":
                  return <SiX className="h-4 w-4" />;
                case "DeepSeek":
                  return <DeepSeekIcon className="h-4 w-4" />;
                default:
                  return <CircleQuestionMark className="h-4 w-4" />;
              }
            })()}
            {models[model]?.name || model}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full flex w-[300px]">
          <Command>
            <CommandInput placeholder="Select model..." />
            <CommandList>
              <CommandEmpty>No models found.</CommandEmpty>
              <CommandGroup>
                {Object.keys(models).map((modelOption) => (
                  <CommandItem
                    key={modelOption}
                    value={modelOption}
                    onSelect={(value) => {
                      setModel(value);
                      setOpen(false);
                    }}
                  >
                    <Tip
                      content={models[modelOption]?.description || "A model"}
                      side="right"
                    >
                      <div className="flex items-center w-full">
                        {modelOption === model && (
                          <CheckIcon className="mr-2 h-4 w-4" />
                        )}
                        {models[modelOption]?.author &&
                          modelOption !== model &&
                          (() => {
                            switch (models[modelOption].author) {
                              case "OpenAI":
                                return <SiOpenai className="mr-2 h-4 w-4" />;
                              case "Anthropic":
                                return <SiAnthropic className="mr-2 h-4 w-4" />;
                              case "Google":
                                return (
                                  <SiGooglegemini className="mr-2 h-4 w-4" />
                                );
                              case "xAI":
                                return <SiX className="mr-2 h-4 w-4" />;
                              case "DeepSeek":
                                return (
                                  <DeepSeekIcon className="mr-2 h-4 w-4" />
                                );
                              default:
                                return (
                                  <CircleQuestionMark className="mr-2 h-4 w-4" />
                                );
                            }
                          })()}
                        {models[modelOption]?.name || modelOption}
                        <div className="flex items-center gap-1 ml-auto">
                          {models[modelOption]?.features?.map((feature) => {
                            switch (feature) {
                              case "vision":
                                return (
                                  <ImageIcon key={feature} className="ml-auto h-4 w-4 text-green-500" />
                                );
                              case "fast":
                                return <Zap key={feature} className="ml-auto h-4 w-4 text-yellow-500" />;
                              case "reasoning":
                                return (
                                  <BrainCircuit key={feature} className="ml-auto h-4 w-4 text-pink-500" />
                                );
                              case "experimental":
                                return (
                                  <FlaskConical key={feature} className="ml-auto h-4 w-4 text-purple-500" />
                                );
                              default:
                                return null;
                            }
                          })}
                        </div>
                        {models[modelOption]?.premium && (
                          <Gem className="ml-1 text-primary" />
                        )}
                      </div>
                    </Tip>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function InputActions({
  model,
  setModel,
  canvas,
  setCanvas,
  search,
  setSearch,
  researchMode,
  setResearchMode,
  handleSubmit,
  thinkingEffort,
  setThinkingEffort,
  input,
}: InputActionsProps) {
  useEffect(() => {
    if (!models[model || "gpt-4o"]?.reasoning_efforts?.find((effort) => effort === "disabled") && thinkingEffort === "disabled" && setThinkingEffort) {
      setThinkingEffort("medium");
    }
  }, [model]);
  return (
    <>
      <UploadButton />
      {canvas !== undefined && setCanvas && (
        <CanvasButton canvas={canvas} setCanvas={setCanvas} />
      )}
      {search !== undefined && setSearch && (
        <SearchButton search={search} setSearch={setSearch} />
      )}
      {researchMode && setResearchMode && search !== undefined && (
        <ResearchModeButton
          search={search}
          researchMode={researchMode}
          setResearchMode={setResearchMode}
        />
      )}

      <div className="flex items-center gap-4 ml-auto">
        {thinkingEffort !== undefined && setThinkingEffort && (
          <ThinkingEffortButton
            model={model || ""}
            thinkingEffort={thinkingEffort}
            setThinkingEffort={setThinkingEffort}
          />
        )}
        {model !== undefined && setModel && (
          <ModelSelector model={model} setModel={setModel} />
        )}
        <Button
          type="submit"
          variant="outline"
          disabled={input.trim().length === 0}
          className="rounded-full"
        >
          <Forward />
        </Button>
      </div>
    </>
  );
}
