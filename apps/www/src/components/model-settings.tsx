"use client";

import { Avatar } from "@workspace/ui/components/avatar";
import { BrainCircuit, Eye, Zap, Filter, Settings } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  SiOpenai,
  SiGooglegemini,
  SiClaude,
  SiX,
} from "@icons-pack/react-simple-icons";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Button } from "@workspace/ui/components/button";
import { Loading } from "@/components/loading";
import { models, Model, ModelFeature } from "@/lib/constants";
import { useSettings } from "@/hooks/use-settings";
import { useTranslations } from "@/hooks/use-translations";
import DeepSeekIcon from "./deepseek-icon";

export default function ModelSettings() {
  const { settings, updateSetting, isLoading: settingsLoading } = useSettings();
  const t = useTranslations("settings.models");
  const tCommon = useTranslations("common.actions");
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filteredModels, setFilteredModels] = useState<
    [string, Model][] | null
  >(null);

  const [filters, setFilters] = useState({
    authors: {
      OpenAI: false,
      Anthropic: false,
      Google: false,
      xAI: false,
      DeepSeek: false,
    },
    features: {
      vision: false,
      fast: false,
      reasoningText: false,
      tools: false,
      experimental: false,
    },
  });

  const activeFilterCount =
    Object.values(filters.authors).filter(Boolean).length +
    Object.values(filters.features).filter(Boolean).length;

  interface Filters {
    authors: Record<string, boolean>;
    features: Record<string, boolean>;
  }

  const toggleFilter = (category: keyof Filters, key: string): void => {
    setFilters({
      ...filters,
      [category]: {
        ...filters[category],
        [key]:
          !filters[category][key as keyof (typeof filters)[typeof category]],
      },
    });
  };

  const resetFilters = () => {
    setFilters({
      authors: {
        OpenAI: false,
        Anthropic: false,
        Google: false,
        xAI: false,
        DeepSeek: false,
      },
      features: {
        vision: false,
        fast: false,
        reasoningText: false,
        tools: false,
        experimental: false,
      },
    });
  };

  const applyFilters = (
    modelEntries: [string, Model][],
    currentFilters: Filters,
  ): [string, Model][] => {
    const activeAuthorFilters = Object.entries(currentFilters.authors).filter(
      ([_, isActive]) => isActive,
    );
    const activeFeatureFilters = Object.entries(currentFilters.features).filter(
      ([_, isActive]) => isActive,
    );

    if (activeAuthorFilters.length === 0 && activeFeatureFilters.length === 0) {
      return modelEntries;
    }

    return modelEntries.filter(([_, model]) => {
      const authorMatch =
        activeAuthorFilters.length === 0 ||
        activeAuthorFilters.some(([author, _]) => model.author === author);
      const featureMatch =
        activeFeatureFilters.length === 0 ||
        activeFeatureFilters.every(([feature, _]) =>
          model.features?.includes(feature as ModelFeature),
        );

      return authorMatch && featureMatch;
    });
  };

  const toggleModelVisibility = async (modelId: string) => {
    const newVisibility = {
      ...visibility,
      [modelId]: !visibility[modelId],
    };
    setVisibility(newVisibility);
    await updateSetting("modelVisibility", newVisibility);
  };

  useEffect(() => {
    // Initialize visibility settings from saved settings or defaults
    if (!settingsLoading) {
      const savedVisibility = settings.modelVisibility;
      if (savedVisibility && Object.keys(savedVisibility).length > 0) {
        // Use saved visibility, but ensure all models have a visibility setting
        const completeVisibility: Record<string, boolean> = {};
        Object.keys(models).forEach((key) => {
          completeVisibility[key] = savedVisibility[key] ?? true;
        });
        setVisibility(completeVisibility);
      } else {
        // Initialize all models as visible by default
        const initialVisibility: Record<string, boolean> = {};
        Object.keys(models).forEach((key) => {
          initialVisibility[key] = true;
        });
        setVisibility(initialVisibility);
      }
      setIsLoading(false);
    }
  }, [settings.modelVisibility, settingsLoading]);

  useEffect(() => {
    setFilteredModels(applyFilters(Object.entries(models), filters));
  }, [filters]);

  if ((isLoading || settingsLoading) && !filteredModels) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="!gap-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  {t("filter")}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-bold">{t("modelAuthors")}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="OpenAI"
                        checked={filters.authors.OpenAI}
                        onCheckedChange={() =>
                          toggleFilter("authors", "OpenAI")
                        }
                      />
                      <label
                        htmlFor="OpenAI"
                        className="text-sm flex items-center"
                      >
                        <SiOpenai className="mr-1" size={14} />{" "}
                        {t("authors.openai")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="Google"
                        checked={filters.authors.Google}
                        onCheckedChange={() =>
                          toggleFilter("authors", "Google")
                        }
                      />
                      <label
                        htmlFor="Google"
                        className="text-sm flex items-center"
                      >
                        <SiGooglegemini className="mr-1" size={14} />{" "}
                        {t("authors.google")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="Anthropic"
                        checked={filters.authors.Anthropic}
                        onCheckedChange={() =>
                          toggleFilter("authors", "Anthropic")
                        }
                      />
                      <label
                        htmlFor="Anthropic"
                        className="text-sm flex items-center"
                      >
                        <SiClaude className="mr-1" size={14} />{" "}
                        {t("authors.anthropic")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="DeepSeek"
                        checked={filters.authors.DeepSeek}
                        onCheckedChange={() =>
                          toggleFilter("authors", "DeepSeek")
                        }
                      />
                      <label
                        htmlFor="DeepSeek"
                        className="text-sm flex items-center"
                      >
                        <DeepSeekIcon className="mr-1" size={14} />
                        {t("authors.deepseek")}
                      </label>
                    </div>
                  </div>

                  <h4 className="font-bold">{t("features")}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reasoning"
                        checked={filters.features.reasoningText}
                        onCheckedChange={() =>
                          toggleFilter("features", "reasoning")
                        }
                      />
                      <label
                        htmlFor="reasoning"
                        className="text-sm flex items-center"
                      >
                        <BrainCircuit size={14} className="mr-1" />
                        {t("featureLabels.reasoning")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vision"
                        checked={filters.features.vision}
                        onCheckedChange={() =>
                          toggleFilter("features", "vision")
                        }
                      />
                      <label
                        htmlFor="vision"
                        className="text-sm flex items-center"
                      >
                        <Eye size={14} className="mr-1" />
                        {t("featureLabels.vision")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fast"
                        checked={filters.features.fast}
                        onCheckedChange={() => toggleFilter("features", "fast")}
                      />
                      <label
                        htmlFor="fast"
                        className="text-sm flex items-center"
                      >
                        <Zap size={14} className="mr-1" />
                        {t("featureLabels.fast")}
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      {tCommon("reset")}
                    </Button>
                    <p className="text-sm text-muted-foreground self-center">
                      {t("showingCount", {
                        count: filteredModels?.length || 0,
                      })}
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="h-full overflow-hidden flex-1">
            {filteredModels?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("noMatchingModels")}
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto pr-2">
                {filteredModels?.map(([id, model]) => (
                  <Card key={id} className="mb-4 !gap-2">
                    <CardContent className="space-y-2">
                      <div className="flex flex-col md:flex-row items-left justify-between w-full">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <Avatar className="bg-secondary flex items-center justify-center flex-shrink-0 p-2 w-10 h-10">
                            {model.author === "OpenAI" && <SiOpenai />}
                            {model.author === "Google" && <SiGooglegemini />}
                            {model.author === "Anthropic" && <SiClaude />}
                            {model.author === "xAI" && <SiX />}
                            {model.author === "DeepSeek" && <DeepSeekIcon />}
                          </Avatar>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <h3 className="text-md sm:text-lg font-bold block min-w-0 truncate">
                              {model.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {model.description}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Switch
                          className="scale-[1.15] sm:scale-125 flex-shrink-0"
                          checked={visibility[id]}
                          onCheckedChange={() => toggleModelVisibility(id)}
                        />
                      </div>

                      <div
                        className={cn(
                          "flex items-center flex-wrap gap-2 mt-1 max-w-full overflow-hidden",
                          !model.features?.length && "hidden",
                        )}
                      >
                        {model.features?.includes("reasoning") && (
                          <Badge
                            variant="secondary"
                            className="bg-red-400/20 text-red-400 hover:bg-red-400/30"
                          >
                            <BrainCircuit
                              size="14"
                              className="mr-1 flex-shrink-0"
                            />
                            <span className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                              {t("featureLabels.reasoning")}
                            </span>
                          </Badge>
                        )}
                        {model.features?.includes("fast") && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                          >
                            <Zap size="14" className="mr-1 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                              {t("featureLabels.fast")}
                            </span>
                          </Badge>
                        )}
                        {model.features?.includes("vision") && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-400/20 text-blue-400 hover:bg-blue-400/30"
                          >
                            <Eye size="14" className="mr-1 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                              {t("featureLabels.vision")}
                            </span>
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
