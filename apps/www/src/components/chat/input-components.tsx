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
  Loader2,
} from "lucide-react";
import { researchModeMapping } from "./input";
import {
  SiAnthropic,
  SiGooglegemini,
  SiOpenai,
  SiX,
} from "@icons-pack/react-simple-icons";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
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
  input: UseChatHelpers["input"];
  thinkingEffort?: "disabled" | "low" | "medium" | "high";
  setThinkingEffort?: (effort: "disabled" | "low" | "medium" | "high") => void;
  handleImageUpload?: (file: File) => void;
  isUploading?: boolean;
}

export const UploadButton = React.memo<{
  handleImageUpload?: (file: File) => void;
  isUploading?: boolean;
}>(function UploadButton({ handleImageUpload, isUploading }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && handleImageUpload) {
            handleImageUpload(file);
          }
        }}
        style={{ display: "none" }}
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
});

export const CanvasButton = React.memo<{
  canvas: boolean;
  setCanvas: (canvas: boolean) => void;
}>(function CanvasButton({ canvas, setCanvas }) {
  return (
    <Button
      type="button"
      variant={canvas ? "secondary" : "ghost"}
      onClick={() => setCanvas(!canvas)}
      className="rounded-full"
    >
      <Presentation className="h-5 w-5" />
      <div className="hidden md:inline">Canvas</div>
    </Button>
  );
});

export const SearchButton = React.memo<{
  search: boolean;
  setSearch: (search: boolean) => void;
}>(function SearchButton({ search, setSearch }) {
  return (
    <Button
      type="button"
      variant={search ? "secondary" : "ghost"}
      onClick={() => setSearch(!search)}
      className="rounded-full"
    >
      <Globe className="h-5 w-5" />
      <div className="hidden md:inline">Search</div>
    </Button>
  );
});

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

export const ThinkingEffortButton = React.memo<{
  model: string;
  thinkingEffort: "disabled" | "low" | "medium" | "high";
  setThinkingEffort: (effort: "disabled" | "low" | "medium" | "high") => void;
}>(function ThinkingEffortButton({ model, thinkingEffort, setThinkingEffort }) {
  const effortMapping: Record<"disabled" | "low" | "medium" | "high", string> =
    {
      disabled: "Off",
      low: "Low",
      medium: "Medium",
      high: "High",
    };

  const [open, setOpen] = useState(false);
  const currentModel = useMemo(() => models[model], [model]);
  const reasoningEfforts = useMemo(
    () => currentModel?.reasoning_efforts,
    [currentModel],
  );

  if (!reasoningEfforts) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="rounded-full">
          <BrainCircuit className="h-5 w-5" />
          <div className="hidden md:inline">
            {effortMapping[thinkingEffort]}
          </div>
        </Button>
      </PopoverTrigger>
      {open && (
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandGroup>
                {reasoningEfforts.map((effort) => (
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
      )}
    </Popover>
  );
});

export const ResearchModeButton = React.memo<{
  search: boolean;
  researchMode: "disabled" | "shallow" | "deep" | "deeper";
  setResearchMode: (mode: "disabled" | "shallow" | "deep" | "deeper") => void;
}>(function ResearchModeButton({ search, researchMode, setResearchMode }) {
  const [open, setOpen] = useState(false);

  const handleResearchModeSelect = useCallback(
    (value: string) => {
      setResearchMode(value as "disabled" | "shallow" | "deep" | "deeper");
      setOpen(false);
    },
    [setResearchMode],
  );

  const researchModes = useMemo(
    () => [
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
    ],
    [],
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
          <div className="hidden md:inline">
            Research{" "}
            <Badge className={cn(researchMode === "disabled" && "hidden")}>
              {researchModeMapping[researchMode]}
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>
      {open && (
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandGroup>
                {researchModes.map((mode) => (
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
      )}
    </Popover>
  );
});

export const ModelSelector = React.memo<{
  model: string;
  setModel: (model: string) => void;
}>(function ModelSelector({ model, setModel }) {
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
            <span className="hidden md:inline">
              {models[model]?.name || model}
            </span>
          </Button>
        </PopoverTrigger>
        {open && (
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
                        // @ts-expect-error
                        content={
                          <div className="p-2 max-w-xs">
                            <div className="font-semibold text-sm mb-1">
                              {models[modelOption]?.name || modelOption}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              by {models[modelOption]?.author}
                            </div>
                            {models[modelOption]?.description && (
                              <div className="text-xs mb-2 w-full">
                                {models[modelOption].description}
                              </div>
                            )}
                            {models[modelOption]?.features &&
                              models[modelOption].features.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {models[modelOption].features.map(
                                    (feature) => (
                                      <Badge
                                        key={feature}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {feature}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                        }
                        className="bg-muted/50 max-w-xs min-w-xs w-xs"
                        side="left"
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
                                  return (
                                    <SiAnthropic className="mr-2 h-4 w-4" />
                                  );
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
                                    <ImageIcon
                                      key={feature}
                                      className="ml-auto h-4 w-4 text-green-500"
                                    />
                                  );
                                case "fast":
                                  return (
                                    <Zap
                                      key={feature}
                                      className="ml-auto h-4 w-4 text-yellow-500"
                                    />
                                  );
                                case "reasoning":
                                  return (
                                    <BrainCircuit
                                      key={feature}
                                      className="ml-auto h-4 w-4 text-pink-500"
                                    />
                                  );
                                case "experimental":
                                  return (
                                    <FlaskConical
                                      key={feature}
                                      className="ml-auto h-4 w-4 text-purple-500"
                                    />
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
        )}
      </Popover>
    </div>
  );
});

const SubmitButton = React.memo<{ disabled: boolean }>(function SubmitButton({
  disabled,
}) {
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={disabled}
      className="rounded-full"
    >
      <Forward />
    </Button>
  );
});

export const InputActions = React.memo<InputActionsProps>(
  function InputActions({
    model,
    setModel,
    canvas,
    setCanvas,
    search,
    setSearch,
    researchMode,
    setResearchMode,
    thinkingEffort,
    setThinkingEffort,
    input,
    handleImageUpload,
    isUploading,
  }) {
    useEffect(() => {
      if (
        !models[model || "gpt-4o"]?.reasoning_efforts?.find(
          (effort) => effort === "disabled",
        ) &&
        thinkingEffort === "disabled" &&
        setThinkingEffort
      ) {
        setThinkingEffort("medium");
      }
    }, [model, thinkingEffort, setThinkingEffort]);
    return (
      <>
        <UploadButton
          handleImageUpload={handleImageUpload}
          isUploading={isUploading}
        />
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
          <SubmitButton disabled={input.trim().length === 0} />
        </div>
      </>
    );
  },
);
