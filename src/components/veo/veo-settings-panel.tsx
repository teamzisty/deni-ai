"use client";

import { useExtracted } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type VeoAspectRatio,
  type VeoDurationSeconds,
  type VeoModel,
  type VeoResolution,
  veoAspectRatios,
  veoDurations,
  veoResolutions,
} from "@/lib/veo";
import type { ImagePayload, ModelOption } from "./veo-types";

export function VeoSettingsPanel({
  negativePrompt,
  onNegativePromptChange,
  model,
  onModelChange,
  modelOptions,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  effectiveDuration,
  onDurationChange,
  seed,
  onSeedChange,
  image,
  fileInputRef,
  onImageChange,
  onClearImage,
}: {
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  model: VeoModel;
  onModelChange: (value: VeoModel) => void;
  modelOptions: ModelOption[];
  aspectRatio: VeoAspectRatio;
  onAspectRatioChange: (value: VeoAspectRatio) => void;
  resolution: VeoResolution;
  onResolutionChange: (value: VeoResolution) => void;
  effectiveDuration: VeoDurationSeconds;
  onDurationChange: (value: VeoDurationSeconds) => void;
  seed: string;
  onSeedChange: (value: string) => void;
  image: ImagePayload | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}) {
  const t = useExtracted();

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>{t("Generation settings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="veo-negative">{t("Negative prompt")}</Label>
          <Textarea
            id="veo-negative"
            value={negativePrompt}
            onChange={(event) => onNegativePromptChange(event.target.value)}
            placeholder={t("cartoon, low quality, blurry")}
            className="min-h-[72px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Model")}</Label>
            <Select value={model} onValueChange={(value) => onModelChange(value as VeoModel)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("Select model")} />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("Aspect ratio")}</Label>
            <Select
              value={aspectRatio}
              onValueChange={(value) => onAspectRatioChange(value as VeoAspectRatio)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("Select ratio")} />
              </SelectTrigger>
              <SelectContent>
                {veoAspectRatios.map((ratio) => (
                  <SelectItem key={ratio} value={ratio}>
                    {ratio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Resolution")}</Label>
            <Select
              value={resolution}
              onValueChange={(value) => onResolutionChange(value as VeoResolution)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("Select resolution")} />
              </SelectTrigger>
              <SelectContent>
                {veoResolutions.map((res) => (
                  <SelectItem key={res} value={res}>
                    {res}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {resolution === "1080p" && (
              <p className="text-xs text-muted-foreground">
                {t("1080p output requires 8s duration.")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("Duration")}</Label>
            <Select
              value={String(effectiveDuration)}
              onValueChange={(value) => {
                const parsed = Number(value);
                if (Number.isNaN(parsed)) {
                  return;
                }
                onDurationChange(parsed as VeoDurationSeconds);
              }}
              disabled={resolution === "1080p"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("Select duration")} />
              </SelectTrigger>
              <SelectContent>
                {veoDurations.map((duration) => (
                  <SelectItem
                    key={duration}
                    value={String(duration)}
                    disabled={resolution === "1080p" && duration !== 8}
                  >
                    {duration}s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="veo-seed">{t("Seed (optional)")}</Label>
            <Input
              id="veo-seed"
              value={seed}
              onChange={(event) => onSeedChange(event.target.value)}
              placeholder={t("e.g. 42")}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="veo-image">{t("Image (optional)")}</Label>
            <Input
              ref={fileInputRef}
              id="veo-image"
              type="file"
              accept="image/*"
              onChange={onImageChange}
            />
            {image && (
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
                <div className="flex flex-col">
                  <span className="font-medium">{image.name}</span>
                  <span className="text-muted-foreground">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={onClearImage}>
                  {t("Remove")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {image?.previewUrl && (
          <div className="space-y-2">
            <Label>{t("Input preview")}</Label>
            <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
              {/* oxlint-disable-next-line lint/performance/noImgElement: preview URLs can be blob/data. */}
              <img
                src={image.previewUrl}
                alt={t("Input preview")}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
