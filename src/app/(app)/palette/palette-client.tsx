"use client";

import {
  AlertCircle,
  ArrowUp,
  Ban,
  ChevronDown,
  Copy,
  Download,
  History,
  ImageIcon,
  RectangleHorizontal,
  RectangleVertical,
  RefreshCw,
  RotateCcw,
  Square,
  SlidersHorizontal,
  TriangleAlert,
  Video,
  X,
} from "lucide-react";
import { useExtracted } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveImageUsageCategory } from "@/lib/image";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const RESOLUTIONS = [
  { value: "1K", label: "1K", hint: "Fastest" },
  { value: "2K", label: "2K", hint: "Sharper" },
  { value: "4K", label: "4K", hint: "Largest" },
] as const;
type Resolution = (typeof RESOLUTIONS)[number]["value"];

const IMAGE_MODELS = [
  {
    id: "gemini-2.5-flash-image",
    name: "Nano Banana",
    note: "Fast sketching lane for volume.",
    resolutions: ["1K", "2K", "4K"],
  },
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Nano Banana 2",
    note: "Balanced detail for most prompts.",
    resolutions: ["1K", "2K", "4K"],
  },
  {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    note: "Heavier lighting, texture, and polish.",
    resolutions: ["1K", "2K", "4K"],
  },
  {
    id: "imagen-4.0-fast-generate-001",
    name: "Imagen 4.0 Fast",
    note: "Real-time image generation.",
    resolutions: ["1K", "2K"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  note: string;
  resolutions: readonly Resolution[];
}>;

type ModelId = (typeof IMAGE_MODELS)[number]["id"];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

const IMAGE_BATCH_SIZE = 4;
const PALETTE_BATCH_COUNT = 4;
const PALETTE_HISTORY_LIMIT = 24;
const PALETTE_HISTORY_STORAGE_KEY = "deni.palette.history.v1";

const TILE_ASPECT_CLASS: Record<AspectRatio, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-[16/9]",
  "9:16": "aspect-[9/16]",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
};

type GeneratedImage = {
  id: string;
  dataUrl: string;
};

type PaletteRequest = {
  prompt: string;
  model: ModelId;
  aspectRatio: AspectRatio;
  resolution: Resolution;
};

type GenerationBatch = {
  id: string;
  createdAt: number;
  prompt: string;
  model: ModelId;
  modelName: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  requestedCount: number;
  duration?: string;
  error?: string;
  status: "pending" | "done" | "error";
  images: GeneratedImage[];
};

type ImageTile = {
  kind: "image";
  id: string;
  batchId: string;
  prompt: string;
  modelName: string;
  aspectRatio: AspectRatio;
  createdAt: number;
  duration?: string;
  dataUrl: string;
};

type PendingTile = {
  kind: "pending";
  id: string;
  prompt: string;
  modelName: string;
  aspectRatio: AspectRatio;
  createdAt: number;
  requestedCount: number;
};

type ErrorTile = {
  kind: "error";
  id: string;
  prompt: string;
  modelName: string;
  aspectRatio: AspectRatio;
  createdAt: number;
  duration?: string;
  error: string;
  batch: GenerationBatch;
};

type FeedTile = ImageTile | PendingTile | ErrorTile;

type PaletteHistoryEntry = PaletteRequest & {
  id: string;
  createdAt: number;
  modelName: string;
};

function dataUrlToBlob(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("Invalid image data.");
  }

  const commaIndex = dataUrl.indexOf(",");

  if (commaIndex === -1) {
    throw new Error("Invalid image data.");
  }

  const header = dataUrl.slice(5, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  const parts = header.split(";");
  const mimeType = parts[0] || "application/octet-stream";
  const isBase64 = parts.includes("base64");

  if (isBase64) {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new Blob([bytes], { type: mimeType });
  }

  return new Blob([decodeURIComponent(payload)], { type: mimeType });
}

function AspectRatioIcon({ ratio }: { ratio: AspectRatio }) {
  if (ratio === "1:1") {
    return <Square className="size-3.5" />;
  }

  if (ratio === "16:9" || ratio === "4:3") {
    return <RectangleHorizontal className="size-3.5" />;
  }

  return <RectangleVertical className="size-3.5" />;
}

function modelSupportsResolution(resolutions: readonly Resolution[], resolution: Resolution) {
  return resolutions.some((value) => value === resolution);
}

function isModelId(value: unknown): value is ModelId {
  return IMAGE_MODELS.some((model) => model.id === value);
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return ASPECT_RATIOS.some((ratio) => ratio === value);
}

function isResolution(value: unknown): value is Resolution {
  return RESOLUTIONS.some((resolution) => resolution.value === value);
}

function parsePaletteHistory(value: string) {
  const parsed = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(
      (entry): entry is PaletteHistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.id === "string" &&
        typeof entry.createdAt === "number" &&
        Number.isFinite(entry.createdAt) &&
        typeof entry.prompt === "string" &&
        entry.prompt.trim().length > 0 &&
        isModelId(entry.model) &&
        isAspectRatio(entry.aspectRatio) &&
        isResolution(entry.resolution),
    )
    .map((entry) => ({
      ...entry,
      modelName:
        typeof entry.modelName === "string" && entry.modelName.trim().length > 0
          ? entry.modelName
          : getImageModel(entry.model).name,
      prompt: entry.prompt.trim(),
    }))
    .slice(0, PALETTE_HISTORY_LIMIT);
}

function createHistoryEntry(options: PaletteRequest): PaletteHistoryEntry {
  const createdAt = Date.now();

  return {
    id: `history-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    prompt: options.prompt.trim(),
    model: options.model,
    modelName: getImageModel(options.model).name,
    aspectRatio: options.aspectRatio,
    resolution: options.resolution,
  };
}

function buildFeedTiles(batches: GenerationBatch[]): FeedTile[] {
  return batches.flatMap<FeedTile>((batch) => {
    if (batch.status === "pending") {
      // Return 4 skeleton placeholders for pending batch
      return [...Array(batch.requestedCount)].map((_, i) => ({
        kind: "pending" as const,
        id: `pending-${batch.id}-${i}`,
        prompt: batch.prompt,
        modelName: batch.modelName,
        aspectRatio: batch.aspectRatio,
        createdAt: batch.createdAt,
        requestedCount: batch.requestedCount,
      }));
    }

    if (batch.status === "error") {
      return [
        {
          kind: "error" as const,
          id: `error-${batch.id}`,
          prompt: batch.prompt,
          modelName: batch.modelName,
          aspectRatio: batch.aspectRatio,
          createdAt: batch.createdAt,
          duration: batch.duration,
          error: batch.error ?? "The image request did not complete.",
          batch,
        },
      ];
    }

    return batch.images.map((image) => ({
      kind: "image" as const,
      id: image.id,
      batchId: batch.id,
      prompt: batch.prompt,
      modelName: batch.modelName,
      aspectRatio: batch.aspectRatio,
      createdAt: batch.createdAt,
      duration: batch.duration,
      dataUrl: image.dataUrl,
    }));
  });
}

function WallTile({
  tile,
  index,
  onOpenImage,
  onRetry,
  retryDisabled = false,
}: {
  tile: FeedTile;
  index: number;
  onOpenImage: (tile: Extract<FeedTile, { kind: "image" }>) => void;
  onRetry: (batch: GenerationBatch) => void;
  retryDisabled?: boolean;
}) {
  return (
    <article
      className={cn(
        "group",
        tile.kind === "image" && "animate-in fade-in-0 zoom-in-95 duration-500",
      )}
      style={
        tile.kind === "image" ? { animationDelay: `${Math.min(index, 15) * 70}ms` } : undefined
      }
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 transition-transform duration-300 hover:scale-[1.01]",
          tile.kind === "image" && "cursor-zoom-in",
          TILE_ASPECT_CLASS[tile.aspectRatio],
        )}
        onClick={() => tile.kind === "image" && onOpenImage(tile)}
        onKeyDown={(event) => {
          if (tile.kind === "image" && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onOpenImage(tile);
          }
        }}
        role={tile.kind === "image" ? "button" : undefined}
        tabIndex={tile.kind === "image" ? 0 : undefined}
      >
        {tile.kind === "image" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tile.dataUrl} alt={tile.prompt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </>
        ) : null}

        {tile.kind === "pending" ? (
          <div className="absolute inset-0 overflow-hidden bg-white/5">
            <div className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 animate-[pulse_2.4s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)]" />
          </div>
        ) : null}

        {tile.kind === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 p-4 text-center">
            <AlertCircle className="mb-2 size-6 text-red-500" />
            <p className="text-xs font-medium text-white/80">Failed to generate</p>
            <button
              type="button"
              onClick={() => onRetry(tile.batch)}
              disabled={retryDisabled}
              className="mt-3 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function getImageModel(model: ModelId) {
  return IMAGE_MODELS.find((item) => item.id === model)!;
}

export default function PaletteClient() {
  const t = useExtracted();
  const usageQuery = trpc.billing.usage.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>(IMAGE_MODELS[1].id);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedResolution, setSelectedResolution] = useState<Resolution>("2K");
  const [activeCount, setActiveCount] = useState(0);
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [historyEntries, setHistoryEntries] = useState<PaletteHistoryEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<Extract<FeedTile, { kind: "image" }> | null>(
    null,
  );

  const selectedModelConfig = getImageModel(selectedModel);
  const selectedUsageCategory = resolveImageUsageCategory(selectedModel);
  const availableResolutions = selectedModelConfig.resolutions;
  const liveTiles = buildFeedTiles(batches);
  const isBusy = activeCount > 0 || isGeneratingPalette;
  const latestCompletedBatch =
    [...batches].reverse().find((batch) => batch.status === "done") ?? null;
  const selectedUsage = usageQuery.data?.usage.find(
    (usage) => usage.category === selectedUsageCategory,
  );
  const usageLimit = selectedUsage?.limit;
  const remainingUsage = selectedUsage?.remaining;
  const usageTier = usageQuery.data?.tier ?? "free";
  const maxModeEnabled = usageQuery.data?.maxModeEnabled ?? false;
  const lowUsageThreshold =
    usageLimit === null || usageLimit === undefined ? null : Math.ceil(usageLimit * 0.1);
  const isUsageLow =
    !maxModeEnabled &&
    remainingUsage !== null &&
    remainingUsage !== undefined &&
    usageLimit !== null &&
    usageLimit !== undefined &&
    lowUsageThreshold !== null &&
    remainingUsage > 0 &&
    remainingUsage <= lowUsageThreshold;
  const isUsageBlocked =
    !maxModeEnabled &&
    remainingUsage !== null &&
    remainingUsage !== undefined &&
    remainingUsage <= 0;
  const usageCategoryLabel = selectedUsageCategory === "premium" ? t("Premium") : t("Basic");
  const usageTierLabel =
    usageTier === "free" ? t("Free") : usageTier === "plus" ? t("Plus") : t("Pro");
  const historyDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    if (!modelSupportsResolution(availableResolutions, selectedResolution)) {
      setSelectedResolution(availableResolutions[0] ?? "1K");
    }
  }, [availableResolutions, selectedResolution]);

  useEffect(() => {
    const storedHistory = window.localStorage.getItem(PALETTE_HISTORY_STORAGE_KEY);

    if (!storedHistory) {
      setHasLoadedHistory(true);
      return;
    }

    try {
      setHistoryEntries(parsePaletteHistory(storedHistory));
    } catch {
      window.localStorage.removeItem(PALETTE_HISTORY_STORAGE_KEY);
    } finally {
      setHasLoadedHistory(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedHistory) {
      return;
    }

    window.localStorage.setItem(PALETTE_HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
  }, [hasLoadedHistory, historyEntries]);

  async function runGenerationBatch(options: {
    prompt: string;
    model: ModelId;
    aspectRatio: AspectRatio;
    resolution: Resolution;
    requestedCount: number;
    bypassCache?: boolean;
  }) {
    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const modelInfo = getImageModel(options.model);
    const effectiveResolution = modelSupportsResolution(modelInfo.resolutions, options.resolution)
      ? options.resolution
      : (modelInfo.resolutions[0] ?? "1K");
    const createdAt = Date.now();

    setFeedError(null);
    setActiveCount((count) => count + 1);
    setBatches((prev) => [
      ...prev,
      {
        id: batchId,
        createdAt,
        prompt: options.prompt,
        model: options.model,
        modelName: modelInfo.name,
        aspectRatio: options.aspectRatio,
        resolution: effectiveResolution,
        requestedCount: options.requestedCount,
        status: "pending",
        images: [],
      },
    ]);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: options.prompt,
          model: options.model,
          aspectRatio: options.aspectRatio,
          resolution: effectiveResolution,
          numberOfImages: options.requestedCount,
          bypassCache: options.bypassCache,
        }),
      });

      const data = (await res.json()) as {
        images?: Array<{ imageBytes: string; mimeType: string }>;
        error?: string;
      };

      if (!res.ok || !data.images) {
        throw new Error(data.error ?? "Generation failed.");
      }

      const duration = `${((Date.now() - createdAt) / 1000).toFixed(1)}s`;
      const nextImages = data.images.map((image, index) => ({
        id: `${batchId}-${index}`,
        dataUrl: `data:${image.mimeType};base64,${image.imageBytes}`,
      }));

      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === batchId
            ? {
                ...batch,
                duration,
                status: "done",
                images: nextImages,
              }
            : batch,
        ),
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      setFeedError(message);
      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === batchId
            ? {
                ...batch,
                duration: `${((Date.now() - createdAt) / 1000).toFixed(1)}s`,
                status: "error",
                error: message,
              }
            : batch,
        ),
      );
      return false;
    } finally {
      setActiveCount((count) => Math.max(0, count - 1));
      void usageQuery.refetch();
    }
  }

  async function runPaletteSequence(options: {
    prompt: string;
    model: ModelId;
    aspectRatio: AspectRatio;
    resolution: Resolution;
    bypassCache?: boolean;
  }) {
    if (isGeneratingPalette) return;

    setIsGeneratingPalette(true);
    setFeedError(null);

    try {
      for (let batchIndex = 0; batchIndex < PALETTE_BATCH_COUNT; batchIndex += 1) {
        const succeeded = await runGenerationBatch({
          ...options,
          requestedCount: IMAGE_BATCH_SIZE,
          bypassCache: options.bypassCache || batchIndex > 0,
        });

        if (!succeeded) {
          break;
        }
      }
    } finally {
      setIsGeneratingPalette(false);
    }
  }

  function appendHistoryEntry(options: PaletteRequest) {
    setHistoryEntries((prev) =>
      [createHistoryEntry(options), ...prev].slice(0, PALETTE_HISTORY_LIMIT),
    );
  }

  function applyHistoryEntry(entry: PaletteRequest) {
    setPrompt(entry.prompt);
    setSelectedModel(entry.model);
    setSelectedAspectRatio(entry.aspectRatio);
    setSelectedResolution(entry.resolution);
  }

  function startPaletteRun(
    options: PaletteRequest,
    config?: { clearPrompt?: boolean; remember?: boolean; bypassCache?: boolean },
  ) {
    const trimmedPrompt = options.prompt.trim();

    if (!trimmedPrompt || isBusy || isUsageBlocked) {
      return;
    }

    const nextRequest = {
      ...options,
      prompt: trimmedPrompt,
    };

    applyHistoryEntry(nextRequest);

    if (config?.remember ?? true) {
      appendHistoryEntry(nextRequest);
    }

    void runPaletteSequence({
      ...nextRequest,
      bypassCache: config?.bypassCache,
    });

    if (config?.clearPrompt) {
      setPrompt("");
    }
  }

  function handleGenerate() {
    startPaletteRun(
      {
        prompt,
        model: selectedModel,
        aspectRatio: selectedAspectRatio,
        resolution: selectedResolution,
      },
      {
        clearPrompt: true,
      },
    );
  }

  function handleGenerateMore() {
    if (!latestCompletedBatch) return;

    startPaletteRun(
      {
        prompt: latestCompletedBatch.prompt,
        model: latestCompletedBatch.model,
        aspectRatio: latestCompletedBatch.aspectRatio,
        resolution: latestCompletedBatch.resolution,
      },
      {
        remember: false,
        bypassCache: true,
      },
    );
  }

  function handleUseHistory(entry: PaletteHistoryEntry) {
    startPaletteRun(
      {
        prompt: entry.prompt,
        model: entry.model,
        aspectRatio: entry.aspectRatio,
        resolution: entry.resolution,
      },
      {
        remember: true,
      },
    );
    setIsHistoryOpen(false);
  }

  function handleFillFromHistory(entry: PaletteHistoryEntry) {
    applyHistoryEntry(entry);
    setIsHistoryOpen(false);
  }

  function handleClearHistory() {
    setHistoryEntries([]);
  }

  function handleRetry(batch: GenerationBatch) {
    if (isUsageBlocked) {
      return;
    }

    void runGenerationBatch({
      prompt: batch.prompt,
      model: batch.model,
      aspectRatio: batch.aspectRatio,
      resolution: batch.resolution,
      requestedCount: IMAGE_BATCH_SIZE,
      bypassCache: true,
    });
  }

  async function handleCopyImage() {
    if (!selectedImage) return;

    try {
      if (!("clipboard" in navigator) || typeof window.ClipboardItem === "undefined") {
        throw new Error("Clipboard API is not available.");
      }

      const blob = dataUrlToBlob(selectedImage.dataUrl);

      await navigator.clipboard.write([
        new window.ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      toast.success("Image copied");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to copy image.");
    }
  }

  function handleDownloadImage() {
    if (!selectedImage) return;

    const mimeMatch = selectedImage.dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);/);
    const extension = mimeMatch?.[1] === "jpeg" ? "jpg" : (mimeMatch?.[1] ?? "png");
    const link = document.createElement("a");
    link.href = selectedImage.dataUrl;
    link.download = `palette-${selectedImage.id}.${extension}`;
    link.click();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-3 z-20 flex justify-end px-3 sm:top-6 sm:px-6">
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-medium text-white/85 shadow-2xl backdrop-blur-xl transition-colors hover:bg-black/50"
        >
          <History className="size-4" />
          <span>{t("History")}</span>
        </button>
      </div>

      {/* Main Grid */}
      <main className="scrollbar-hide flex-1 overflow-y-auto px-3 pt-4 pb-56 sm:px-6 sm:pt-6 sm:pb-40">
        {liveTiles.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/30">
            <div className="text-center">
              <ImageIcon className="mx-auto mb-4 size-12 opacity-20" />
              <p>{t("Empty")}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
            {liveTiles.map((tile, index) => (
              <WallTile
                key={tile.id}
                tile={tile}
                index={index}
                onOpenImage={setSelectedImage}
                onRetry={handleRetry}
                retryDisabled={isUsageBlocked}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Input Dock */}
      <div className="fixed inset-x-0 bottom-3 z-20 px-3 sm:bottom-10 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:px-6 lg:-translate-x-1/3">
        <div className="flex flex-col gap-3">
          {feedError && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-2xl backdrop-blur-xl">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 break-words">{feedError}</span>
            </div>
          )}

          {(isUsageLow || isUsageBlocked) && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
                isUsageBlocked
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-300",
              )}
            >
              {isUsageBlocked ? (
                <Ban className="mt-0.5 size-4 shrink-0" />
              ) : (
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">
                  {isUsageBlocked ? t("Usage limit reached") : t("You are running low")}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  {isUsageBlocked
                    ? t("You've hit the {category} usage limit on your {tier} plan.", {
                        category: usageCategoryLabel,
                        tier: usageTierLabel,
                      })
                    : remainingUsage === null || remainingUsage === undefined
                      ? t("Only a few {category} requests left on your {tier} plan.", {
                          category: usageCategoryLabel,
                          tier: usageTierLabel,
                        })
                      : t(
                          "Only {count, plural, one {#} other {#}} {category} requests left on your {tier} plan.",
                          {
                            count: remainingUsage,
                            category: usageCategoryLabel,
                            tier: usageTierLabel,
                          },
                        )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void usageQuery.refetch()}
                className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/15"
              >
                {t("Refresh usage")}
              </button>
            </div>
          )}

          {latestCompletedBatch && activeCount === 0 && !isGeneratingPalette ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/70 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-white">{t("Generate more?")}</p>
                <p className="truncate text-xs text-white/45">{latestCompletedBatch.prompt}</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateMore}
                disabled={isUsageBlocked}
                className="w-full rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto sm:shrink-0"
              >
                {t("Generate more")}
              </button>
            </div>
          ) : null}

          <div className="relative rounded-[2rem] bg-[#1a1a1a]/90 p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl sm:rounded-[2.5rem]">
            <div className="flex flex-col gap-2 px-1 py-1 sm:flex-row sm:items-center sm:gap-1 sm:px-2 sm:py-0">
              <div className="flex items-center gap-1">
                <Button variant={"secondary"} size="icon">
                  <ImageIcon className="size-4" />
                </Button>
                <Button variant={"ghost"} disabled size="icon">
                  <Video className="size-4" />
                </Button>
              </div>

              {/* Input */}
              <div className="min-w-0 flex-1 rounded-[1.5rem] bg-black/20 px-4 ring-1 ring-white/6">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isUsageBlocked}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={t("Create your palette")}
                  className="w-full bg-transparent py-3 text-[15px] text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 sm:gap-1 sm:pr-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 sm:flex-none sm:px-4">
                      <AspectRatioIcon ratio={selectedAspectRatio} />
                      <span>{selectedAspectRatio}</span>
                      <ChevronDown className="size-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-32 border-white/10 bg-[#1a1a1a] text-white"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <DropdownMenuItem
                        key={ratio}
                        onClick={() => setSelectedAspectRatio(ratio)}
                        className="flex items-center gap-2 hover:bg-white/5 focus:bg-white/5"
                      >
                        <AspectRatioIcon ratio={ratio} />
                        {ratio}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/90 transition-colors hover:bg-white/10">
                      <SlidersHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 space-y-4 border-white/10 bg-[#1a1a1a] p-3 text-white"
                  >
                    <div className="space-y-2">
                      <p className="px-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
                        Model
                      </p>
                      {IMAGE_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={cn(
                            "flex flex-col items-start gap-0.5 rounded-lg px-2 py-1.5",
                            selectedModel === model.id
                              ? "bg-white/10"
                              : "hover:bg-white/5 focus:bg-white/5",
                          )}
                        >
                          <span className="text-sm font-medium">{model.name}</span>
                          <span className="text-[10px] text-white/40">{model.note}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-2">
                      <p className="px-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
                        Resolution
                      </p>
                      <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                        {RESOLUTIONS.map((res) => {
                          const disabled = !modelSupportsResolution(
                            availableResolutions,
                            res.value,
                          );
                          return (
                            <button
                              key={res.value}
                              disabled={disabled}
                              onClick={() => setSelectedResolution(res.value)}
                              className={cn(
                                "flex-1 rounded-lg py-1 text-xs transition-colors",
                                selectedResolution === res.value
                                  ? "bg-white/10 text-white"
                                  : "text-white/40 hover:text-white/60",
                                disabled && "cursor-not-allowed opacity-20",
                              )}
                            >
                              {res.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isBusy || isUsageBlocked}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition-all hover:bg-white/20 disabled:opacity-20"
                >
                  {isBusy ? (
                    <RefreshCw className="size-5 animate-spin" />
                  ) : (
                    <ArrowUp className="size-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent
          side="right"
          className="gap-0 border-white/10 bg-[#050505] p-0 text-white sm:max-w-md"
        >
          <SheetHeader className="gap-3 border-b border-white/10 px-5 py-5">
            <div className="space-y-1 pr-10">
              <SheetTitle className="text-base text-white">{t("History")}</SheetTitle>
              <SheetDescription className="text-white/45">
                {t("Review previous prompts and rerun them instantly.")}
              </SheetDescription>
            </div>

            {historyEntries.length > 0 ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex w-fit items-center rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {t("Clear")}
              </button>
            ) : null}
          </SheetHeader>

          <div className="scrollbar-hide flex-1 overflow-y-auto p-3">
            {historyEntries.length === 0 ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                <History className="mb-4 size-10 text-white/20" />
                <p className="text-sm font-medium text-white/80">{t("No history yet.")}</p>
                <p className="mt-2 text-sm text-white/40">
                  {t("Your recent palette prompts will appear here.")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-3 text-sm leading-6 text-white">{entry.prompt}</p>
                        <p className="mt-2 text-xs text-white/35">
                          {historyDateFormatter.format(entry.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/55">
                      <span className="rounded-full bg-white/6 px-2.5 py-1">{entry.modelName}</span>
                      <span className="rounded-full bg-white/6 px-2.5 py-1">
                        {entry.aspectRatio}
                      </span>
                      <span className="rounded-full bg-white/6 px-2.5 py-1">
                        {entry.resolution}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUseHistory(entry)}
                        disabled={isBusy || isUsageBlocked}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-30"
                      >
                        <RotateCcw className="size-3.5" />
                        {t("Use again")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillFromHistory(entry)}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        {t("Fill prompt")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(selectedImage)}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="h-[94vh] max-w-[96vw] overflow-hidden border-white/10 bg-[#050505] p-0 text-white shadow-[0_40px_180px_-56px_rgba(0,0,0,0.98)]"
        >
          {selectedImage ? (
            <div className="relative h-full w-full">
              <DialogTitle className="sr-only">Generated image</DialogTitle>
              <DialogDescription className="sr-only">
                Preview, copy, download, or close this image.
              </DialogDescription>

              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.dataUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full scale-110 object-cover opacity-30 blur-2xl"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.7))]" />
              </div>

              <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  aria-label="Download image"
                  className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/36 text-white/82 backdrop-blur-xl transition-colors hover:bg-black/52"
                >
                  <Download className="size-4.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyImage}
                  aria-label="Copy image"
                  className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/36 text-white/82 backdrop-blur-xl transition-colors hover:bg-black/52"
                >
                  <Copy className="size-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  aria-label="Close dialog"
                  className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/36 text-white/82 backdrop-blur-xl transition-colors hover:bg-black/52"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <div className="relative flex h-full items-center justify-center p-4 sm:p-6 md:p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.dataUrl}
                  alt={selectedImage.prompt}
                  className="max-h-full max-w-full rounded-[1.6rem] object-contain shadow-[0_30px_120px_-40px_rgba(0,0,0,0.95)]"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
