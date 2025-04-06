"use client";

import { Avatar } from "@repo/ui/components/avatar";
import {
  AlertCircle,
  BrainCircuit,
  Eye,
  FlaskConical,
  Zap,
  Filter,
  Ban,
} from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { useModelVisibility } from "@/hooks/use-model-settings";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { modelDescriptions } from "@/lib/modelDescriptions";

type ModelDescription = {
  displayName: string;
  knowledgeCutoff: string;
  type: string;
  canary?: boolean;
  reasoning?: boolean;
  vision?: boolean;
  offline?: boolean;
};
import {
  SiOpenai,
  SiGooglegemini,
  SiClaude,
  SiX,
} from "@icons-pack/react-simple-icons";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Button } from "@repo/ui/components/button";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { DeepSeekIcon } from "@/components/DeepSeekIcon";

export default function ModelSettingsPage() {
  const { visibility, toggleModelVisibility } = useModelVisibility();
  const { auth, user, isLoading } = useAuth();
  const t = useTranslations();
  const router = useRouter();

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
      vision: false,
      canary: false,
      offline: false,
    },
  });

  const activeFilterCount =
    Object.values(filters.types).filter(Boolean).length +
    Object.values(filters.features).filter(Boolean).length;

  useEffect(() => {
    if (auth && !user && !isLoading) {
      router.push("/login");
    }
  }, [user, isLoading, router, auth]);

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
        vision: false,
        canary: false,
        offline: false,
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

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const filteredModels = applyFilters(
    Object.entries(modelDescriptions),
    filters
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">{t("modelSettings.title")}</h3>
            <p className="text-muted-foreground">
              {t("modelSettings.description")}
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                {t("modelSettings.filter")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-bold">{t("modelSettings.modelTypes")}</h4>
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
                    <label
                      htmlFor="Gemini"
                      className="text-sm flex items-center"
                    >
                      <SiGooglegemini className="mr-1" size={14} /> Gemini
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="Claude"
                      checked={filters.types.Claude}
                      onCheckedChange={() => toggleFilter("types", "Claude")}
                    />
                    <label
                      htmlFor="Claude"
                      className="text-sm flex items-center"
                    >
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

                <h4 className="font-bold">{t("modelSettings.features")}</h4>
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
                      {t("modelSettings.reasoning")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vision"
                      checked={filters.features.vision}
                      onCheckedChange={() => toggleFilter("features", "vision")}
                    />
                    <label
                      htmlFor="vision"
                      className="text-sm flex items-center"
                    >
                      <Eye size={14} className="mr-1" />{" "}
                      {t("modelSettings.image")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canary"
                      checked={filters.features.canary}
                      onCheckedChange={() => toggleFilter("features", "canary")}
                    />
                    <label
                      htmlFor="canary"
                      className="text-sm flex items-center"
                    >
                      <FlaskConical size={14} className="mr-1" />{" "}
                      {t("modelSettings.experimental")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="offline"
                      checked={filters.features.offline}
                      onCheckedChange={() =>
                        toggleFilter("features", "offline")
                      }
                    />
                    <label
                      htmlFor="offline"
                      className="text-sm flex items-center"
                    >
                      <Ban size={14} className="mr-1" />{" "}
                      {t("modelSelector.offline")}
                    </label>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    {t("modelSettings.reset")}
                  </Button>
                  <p className="text-sm text-muted-foreground self-center">
                    {filteredModels.length} {t("modelSettings.showing")}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {filteredModels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("modelSettings.noModels")}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-240px)]">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("modelSettings.experimentalInfo")}</AlertTitle>
              <AlertDescription>
                {t("modelSettings.experimentalDescription")}
              </AlertDescription>
            </Alert>

            {filteredModels.map(
              ([
                id,
                {
                  displayName,
                  knowledgeCutoff,
                  type,
                  fast,
                  canary,
                  reasoning,
                  vision,
                  offline,
                },
              ]) => (
                <div
                  key={id}
                  className="w-full flex items-center p-4 gap-3 bg-card hover:bg-card/80 cursor-pointer transition-colors rounded-sm shadow mb-6"
                >
                  <Avatar className="bg-secondary flex items-center justify-center">
                    {type === "ChatGPT" && <SiOpenai />}
                    {type === "Gemini" && <SiGooglegemini />}
                    {type === "Claude" && <SiClaude />}
                    {type === "Grok" && <SiX size="16" />}
                    {type === "DeepSeek" && <DeepSeekIcon />}
                  </Avatar>
                  <div className="flex items-center flex-wrap justify-between w-full">
                    <div className="w-[80%]">
                      <h3 className="text-lg font-bold">{displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("modelSettings.knowledgeCutoff")} {knowledgeCutoff}
                      </p>
                      <div
                        className={cn(
                          "flex items-center flex-wrap gap-2 mt-1",
                          !reasoning && !canary && !offline && "hidden"
                        )}
                      >
                        {reasoning && (
                          <Badge
                            variant="secondary"
                            className="bg-red-400 text-black"
                          >
                            <BrainCircuit size="16" className="mr-1" />
                            <span className="text-xs">
                              {t("modelSettings.reasoning")}
                            </span>
                          </Badge>
                        )}
                        {canary && (
                          <Badge
                            variant="secondary"
                            className="bg-green-400 text-black"
                          >
                            <FlaskConical size="16" className="mr-1" />
                            <span className="text-xs">
                              {t("modelSettings.experimental")}
                            </span>
                          </Badge>
                        )}
                        {fast && (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-400 text-black"
                          >
                            <Zap size="16" className="mr-1" />
                            <span className="text-xs">
                              {t("modelSettings.fast")}
                            </span>
                          </Badge>
                        )}
                        {vision && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-400 text-black"
                          >
                            <Eye size="16" className="mr-1" />
                            <span className="text-xs">
                              {t("modelSettings.image")}
                            </span>
                          </Badge>
                        )}{" "}
                      </div>
                    </div>
                    <Switch
                      checked={visibility[id]}
                      onCheckedChange={() => toggleModelVisibility(id)}
                    />
                  </div>
                </div>
              )
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
