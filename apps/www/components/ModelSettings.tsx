"use client";

import { Avatar } from "@workspace/ui/components/avatar";
import {
  BrainCircuit,
  Eye,
  Zap,
  Filter,
  DoorOpen,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { useModelVisibility } from "@/hooks/use-model-settings";
import { modelDescriptions } from "@/lib/modelDescriptions";

import {
  SiOpenai,
  SiGooglegemini,
  SiClaude,
  SiX,
} from "@icons-pack/react-simple-icons";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Button } from "@workspace/ui/components/button";
import { DeepSeekIcon } from "@/components/DeepSeekIcon";

export default function ModelSettings() {
  const { visibility, toggleModelVisibility } = useModelVisibility();
  const t = useTranslations();

  const [filters, setFilters] = useState({
    types: {
      ChatGPT: false,
      Gemini: false,
      Claude: false,
      Grok: false,
      DeepSeek: false,
    },
    features: {
      reasoning: false,
      vision: false
    },
  });

  const activeFilterCount =
    Object.values(filters.types).filter(Boolean).length +
    Object.values(filters.features).filter(Boolean).length;

  interface Filters {
    types: Record<string, boolean>;
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
      types: {
        ChatGPT: false,
        Gemini: false,
        Claude: false,
        Grok: false,
        DeepSeek: false,
      },
      features: {
        reasoning: false,
        vision: false
      },
    });
  };

  interface Model {
    type: string;
    [key: string]: any;
  }

  const applyFilters = (
    models: [string, Model][],
    filters: Filters
  ): [string, Model][] => {
    const activeTypeFilters = Object.entries(filters.types).filter(
      ([_, isActive]) => isActive
    );
    const activeFeatureFilters = Object.entries(filters.features).filter(
      ([_, isActive]) => isActive
    );

    if (activeTypeFilters.length === 0 && activeFeatureFilters.length === 0) {
      return models;
    }

    return models.filter(([id, model]) => {
      const typeMatch =
        activeTypeFilters.length === 0 ||
        activeTypeFilters.some(([type, _]) => model.type === type);
      const featureMatch =
        activeFeatureFilters.length === 0 ||
        activeFeatureFilters.every(([feature, _]) => model[feature]);

      return typeMatch && featureMatch;
    });
  };

  const filteredModels = applyFilters(
    Object.entries(modelDescriptions),
    filters
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              {t("settings.model.filter")}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-bold">{t("settings.model.modelTypes")}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ChatGPT"
                    checked={filters.types.ChatGPT}
                    onCheckedChange={() => toggleFilter("types", "ChatGPT")}
                  />
                  <label
                    htmlFor="ChatGPT"
                    className="text-sm flex items-center"
                  >
                    <SiOpenai className="mr-1" size={14} /> OpenAI
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="Gemini"
                    checked={filters.types.Gemini}
                    onCheckedChange={() => toggleFilter("types", "Gemini")}
                  />
                  <label htmlFor="Gemini" className="text-sm flex items-center">
                    <SiGooglegemini className="mr-1" size={14} /> Gemini
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="Claude"
                    checked={filters.types.Claude}
                    onCheckedChange={() => toggleFilter("types", "Claude")}
                  />
                  <label htmlFor="Claude" className="text-sm flex items-center">
                    <SiClaude className="mr-1" size={14} /> Claude
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="Grok"
                    checked={filters.types.Grok}
                    onCheckedChange={() => toggleFilter("types", "Grok")}
                  />
                  <label htmlFor="Grok" className="text-sm flex items-center">
                    <SiX className="mr-1" size={14} /> Grok
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="DeepSeek"
                    checked={filters.types.DeepSeek}
                    onCheckedChange={() => toggleFilter("types", "DeepSeek")}
                  />
                  <label
                    htmlFor="DeepSeek"
                    className="text-sm flex items-center"
                  >
                    <DeepSeekIcon size={14} className="mr-1" />
                    DeepSeek
                  </label>
                </div>
              </div>

              <h4 className="font-bold">{t("settings.model.features")}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reasoning"
                    checked={filters.features.reasoning}
                    onCheckedChange={() =>
                      toggleFilter("features", "reasoning")
                    }
                  />
                  <label
                    htmlFor="reasoning"
                    className="text-sm flex items-center"
                  >
                    <BrainCircuit size={14} className="mr-1" />{" "}
                    {t("common.modelFeatures.reasoning")}
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vision"
                    checked={filters.features.vision}
                    onCheckedChange={() => toggleFilter("features", "vision")}
                  />
                  <label htmlFor="vision" className="text-sm flex items-center">
                    <Eye size={14} className="mr-1" />{" "}
                    {t("common.modelFeatures.vision")}
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  {t("settings.model.reset")}
                </Button>
                <p className="text-sm text-muted-foreground self-center">
                  {filteredModels.length} {t("settings.model.showing")}
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-full overflow-hidden flex-1">
        {filteredModels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("settings.model.noModels")}
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto pr-2">
            {filteredModels.map(
              ([
                id,
                {
                  displayName,
                  type,
                  fast,
                  reasoning,
                  description,
                  vision,
                },
              ]) => (
                <div
                  key={id}
                  className="w-full max-w-full flex flex-col p-3 sm:p-4 gap-3 bg-card/50 hover:bg-card/80 cursor-pointer transition-colors rounded-md border border-border/30 mb-6 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-left justify-between w-full">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar className="bg-secondary flex items-center justify-center flex-shrink-0 p-2 w-10 h-10">
                        {type === "ChatGPT" && <SiOpenai />}
                        {type === "Gemini" && <SiGooglegemini />}
                        {type === "Claude" && <SiClaude />}
                        {type === "Grok" && <SiX size="16" />}
                        {type === "DeepSeek" && <DeepSeekIcon />}
                      </Avatar>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3 className="text-md sm:text-lg font-bold block min-w-0 truncate">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-1">
                          {description.includes("Leaving") && (
                            <DoorOpen size={16} className="text-red-400" />
                          )}
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {description}
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
                      !reasoning &&
                        !vision &&
                        !fast &&
                        "hidden"
                    )}
                  >
                    {reasoning && (
                      <Badge
                        variant="secondary"
                        className="bg-red-400/20 text-red-400 hover:bg-red-400/30"
                      >
                        <BrainCircuit
                          size="14"
                          className="mr-1 flex-shrink-0"
                        />
                        <span className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                          {t("common.modelFeatures.reasoning")}
                        </span>
                      </Badge>
                    )}
                    {fast && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                      >
                        <Zap size="14" className="mr-1 flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                          {t("common.modelFeatures.fast")}
                        </span>
                      </Badge>
                    )}
                    {vision && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-400/20 text-blue-400 hover:bg-blue-400/30"
                      >
                        <Eye size="14" className="mr-1 flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                          {t("common.modelFeatures.vision")}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
