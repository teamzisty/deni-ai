"use client";

import { Badge } from "@/components/ui/badge";
import { VeoChatPanel } from "./veo-chat-panel";
import { VeoSettingsPanel } from "./veo-settings-panel";
import { useVeoGenerator } from "./use-veo-generator";

export function VeoGenerator() {
  const {
    t,
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    submittedPrompt,
    submittedNegativePrompt,
    submittedImage,
    model,
    setModel,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    setDurationSeconds,
    seed,
    setSeed,
    image,
    status,
    error,
    operationName,
    videoUrl,
    fileInputRef,
    effectiveDuration,
    modelOptions,
    isBusy,
    statusLabel,
    statusVariant,
    settingsSnapshot,
    modelLabel,
    handleImageChange,
    handleClearImage,
    handleCancel,
    handleGenerate,
  } = useVeoGenerator();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("Veo Studio")}</h1>
          <Badge variant="secondary">{t("Veo 3.1 Preview")}</Badge>
        </div>
        <p className="text-muted-foreground">
          {t("Generate short videos with Veo 3.1. Prompts can include audio cues.")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <VeoChatPanel
          status={status}
          statusLabel={statusLabel}
          statusVariant={statusVariant}
          isBusy={isBusy}
          submittedPrompt={submittedPrompt}
          submittedNegativePrompt={submittedNegativePrompt}
          submittedImage={submittedImage}
          settingsSnapshot={settingsSnapshot}
          modelLabel={modelLabel}
          error={error}
          videoUrl={videoUrl}
          operationName={operationName}
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onCancel={handleCancel}
        />

        <VeoSettingsPanel
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          model={model}
          onModelChange={setModel}
          modelOptions={modelOptions}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          resolution={resolution}
          onResolutionChange={setResolution}
          effectiveDuration={effectiveDuration}
          onDurationChange={setDurationSeconds}
          seed={seed}
          onSeedChange={setSeed}
          image={image}
          fileInputRef={fileInputRef}
          onImageChange={handleImageChange}
          onClearImage={handleClearImage}
        />
      </div>
    </div>
  );
}
