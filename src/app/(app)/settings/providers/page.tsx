"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/react";

const PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    description: "Use your own OpenAI API key.",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Use your own Anthropic API key.",
  },
  {
    id: "google",
    label: "Google",
    description: "Use your own Google Generative AI key.",
  },
  {
    id: "xai",
    label: "xAI",
    description: "Use your own xAI API key.",
  },
  {
    id: "openai_compatible",
    label: "OpenAI-compatible",
    description: "Use any OpenAI-compatible endpoint (proxy, gateway, local).",
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];
type ApiStyle = "chat" | "responses";

const defaultKeyState = PROVIDERS.reduce(
  (acc, provider) => {
    acc[provider.id] = "";
    return acc;
  },
  {} as Record<ProviderId, string>,
);

const defaultPreferState = PROVIDERS.reduce(
  (acc, provider) => {
    acc[provider.id] = provider.id === "openai_compatible";
    return acc;
  },
  {} as Record<ProviderId, boolean>,
);

export default function ProvidersPage() {
  const utils = trpc.useUtils();
  const configQuery = trpc.providers.getConfig.useQuery();
  const upsertKey = trpc.providers.upsertKey.useMutation();
  const deleteKey = trpc.providers.deleteKey.useMutation();
  const upsertSetting = trpc.providers.upsertSetting.useMutation();
  const createCustomModel = trpc.providers.createCustomModel.useMutation();
  const deleteCustomModel = trpc.providers.deleteCustomModel.useMutation();

  const [keyInputs, setKeyInputs] =
    useState<Record<ProviderId, string>>(defaultKeyState);
  const [preferByok, setPreferByok] =
    useState<Record<ProviderId, boolean>>(defaultPreferState);
  const [openAiCompatBaseUrl, setOpenAiCompatBaseUrl] = useState("");
  const [openAiCompatApiStyle, setOpenAiCompatApiStyle] =
    useState<ApiStyle>("responses");

  const [customName, setCustomName] = useState("");
  const [customModelId, setCustomModelId] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customPremium, setCustomPremium] = useState(false);
  const [customInputPrice, setCustomInputPrice] = useState("");
  const [customOutputPrice, setCustomOutputPrice] = useState("");
  const [customReasoningPrice, setCustomReasoningPrice] = useState("");

  const settingsByProvider = useMemo(() => {
    const map = new Map<
      ProviderId,
      { preferByok: boolean; baseUrl?: string | null; apiStyle?: ApiStyle }
    >();
    for (const setting of configQuery.data?.settings ?? []) {
      map.set(setting.provider as ProviderId, {
        preferByok: setting.preferByok,
        baseUrl: setting.baseUrl ?? null,
        apiStyle: setting.apiStyle,
      });
    }
    return map;
  }, [configQuery.data?.settings]);

  const configuredProviders = useMemo(() => {
    return new Set(
      (configQuery.data?.keys ?? []).map((entry) => entry.provider),
    );
  }, [configQuery.data?.keys]);

  const customModels = configQuery.data?.customModels ?? [];

  useEffect(() => {
    if (!configQuery.data) return;
    const nextPrefer = { ...defaultPreferState };
    for (const provider of PROVIDERS) {
      const setting = settingsByProvider.get(provider.id);
      nextPrefer[provider.id] =
        setting?.preferByok ?? provider.id === "openai_compatible";
    }
    setPreferByok(nextPrefer);

    const openAiSetting = settingsByProvider.get("openai_compatible");
    setOpenAiCompatBaseUrl(openAiSetting?.baseUrl ?? "");
    setOpenAiCompatApiStyle(openAiSetting?.apiStyle ?? "responses");
  }, [configQuery.data, settingsByProvider]);

  const handleSaveKey = async (providerId: ProviderId) => {
    const value = keyInputs[providerId]?.trim();
    if (!value) {
      toast.error("Enter an API key first.");
      return;
    }

    try {
      await upsertKey.mutateAsync({ provider: providerId, apiKey: value });
      await upsertSetting.mutateAsync({
        provider: providerId,
        preferByok: true,
      });
      setPreferByok((prev) => ({ ...prev, [providerId]: true }));
      setKeyInputs((prev) => ({ ...prev, [providerId]: "" }));
      await utils.providers.getConfig.invalidate();
      toast.success("API key saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save API key.",
      );
    }
  };

  const handleDeleteKey = async (providerId: ProviderId) => {
    try {
      await deleteKey.mutateAsync({ provider: providerId });
      await utils.providers.getConfig.invalidate();
      toast.success("API key removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove API key.",
      );
    }
  };

  const handlePreferToggle = async (providerId: ProviderId, value: boolean) => {
    setPreferByok((prev) => ({ ...prev, [providerId]: value }));
    try {
      await upsertSetting.mutateAsync({
        provider: providerId,
        preferByok: value,
      });
      await utils.providers.getConfig.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update preference.",
      );
    }
  };

  const handleSaveOpenAiCompat = async () => {
    const baseUrl = openAiCompatBaseUrl.trim();
    if (!baseUrl) {
      toast.error("Base URL is required for OpenAI-compatible endpoints.");
      return;
    }

    try {
      await upsertSetting.mutateAsync({
        provider: "openai_compatible",
        baseUrl,
        apiStyle: openAiCompatApiStyle,
        preferByok: true,
      });
      await utils.providers.getConfig.invalidate();
      toast.success("Endpoint settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save endpoint.",
      );
    }
  };

  const parsePrice = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return null;
    }
    return parsed;
  };

  const handleCreateCustomModel = async () => {
    const name = customName.trim();
    const modelId = customModelId.trim();
    if (!name || !modelId) {
      toast.error("Name and model ID are required.");
      return;
    }

    const inputPriceMicros = parsePrice(customInputPrice);
    const outputPriceMicros = parsePrice(customOutputPrice);
    const reasoningPriceMicros = parsePrice(customReasoningPrice);

    if (customInputPrice.trim() && inputPriceMicros === null) {
      toast.error("Input price must be a non-negative integer.");
      return;
    }
    if (customOutputPrice.trim() && outputPriceMicros === null) {
      toast.error("Output price must be a non-negative integer.");
      return;
    }
    if (customReasoningPrice.trim() && reasoningPriceMicros === null) {
      toast.error("Reasoning price must be a non-negative integer.");
      return;
    }

    try {
      await createCustomModel.mutateAsync({
        provider: "openai_compatible",
        name,
        modelId,
        description: customDescription.trim() || null,
        premium: customPremium,
        inputPriceMicros,
        outputPriceMicros,
        reasoningPriceMicros,
      });
      setCustomName("");
      setCustomModelId("");
      setCustomDescription("");
      setCustomPremium(false);
      setCustomInputPrice("");
      setCustomOutputPrice("");
      setCustomReasoningPrice("");
      await utils.providers.getConfig.invalidate();
      toast.success("Custom model added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add custom model.",
      );
    }
  };

  const handleDeleteCustomModel = async (id: string) => {
    try {
      await deleteCustomModel.mutateAsync({ id });
      await utils.providers.getConfig.invalidate();
      toast.success("Custom model removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove custom model.",
      );
    }
  };

  if (configQuery.isLoading) {
    return <Spinner />;
  }

  const openAiCompatSetting = settingsByProvider.get("openai_compatible");
  const effectiveApiStyle =
    openAiCompatSetting?.apiStyle ?? openAiCompatApiStyle;
  const effectiveBaseUrl = openAiCompatSetting?.baseUrl ?? openAiCompatBaseUrl;

  return (
    <div className="mx-auto flex max-w-4xl w-full flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Providers</h1>
        <p className="text-muted-foreground">
          Bring your own keys, configure OpenAI-compatible endpoints, and add
          custom models.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BYOK keys</CardTitle>
          <CardDescription>
            Saved keys are encrypted. Requests sent with BYOK are not counted
            toward usage limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PROVIDERS.map((provider) => {
            const configured = configuredProviders.has(provider.id);
            const prefer = preferByok[provider.id] ?? false;
            const isOpenAiCompat = provider.id === "openai_compatible";
            const inputId = `provider-key-${provider.id}`;
            return (
              <div
                key={provider.id}
                className="flex flex-col gap-3 rounded-lg border border-border/70 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{provider.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                  {!isOpenAiCompat && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`prefer-${provider.id}`}
                        className="text-xs"
                      >
                        Prefer BYOK
                      </Label>
                      <Switch
                        id={`prefer-${provider.id}`}
                        checked={prefer}
                        onCheckedChange={(checked) =>
                          handlePreferToggle(provider.id, Boolean(checked))
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="flex-1">
                    <Label htmlFor={inputId} className="sr-only">
                      {provider.label} API key
                    </Label>
                    <Input
                      id={inputId}
                      type="password"
                      placeholder="sk-••••"
                      value={keyInputs[provider.id]}
                      onChange={(event) =>
                        setKeyInputs((prev) => ({
                          ...prev,
                          [provider.id]: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveKey(provider.id)}
                      disabled={upsertKey.isPending}
                    >
                      {configured ? "Update key" : "Save key"}
                    </Button>
                    {configured && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteKey(provider.id)}
                        disabled={deleteKey.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Status: {configured ? "Saved" : "Not configured"}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI-compatible endpoint</CardTitle>
          <CardDescription>
            Configure a base URL and API style for OpenAI-compatible providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-compat-base-url">Base URL</Label>
            <Input
              id="openai-compat-base-url"
              placeholder="https://api.your-provider.com/v1"
              value={openAiCompatBaseUrl}
              onChange={(event) => setOpenAiCompatBaseUrl(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>API style</Label>
            <Select
              value={openAiCompatApiStyle}
              onValueChange={(value) => {
                if (value === "chat" || value === "responses") {
                  setOpenAiCompatApiStyle(value);
                }
              }}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select API style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responses">Responses API</SelectItem>
                <SelectItem value="chat">Chat Completions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSaveOpenAiCompat}
              disabled={upsertSetting.isPending}
            >
              Save endpoint
            </Button>
            <p className="text-xs text-muted-foreground">
              Active: {effectiveBaseUrl ? "Yes" : "No"} · API:{" "}
              {effectiveApiStyle}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom models</CardTitle>
          <CardDescription>
            Add OpenAI-compatible models for your endpoint. These are available
            in the chat model selector.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom-model-name">Display name</Label>
              <Input
                id="custom-model-name"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-model-id">Model ID</Label>
              <Input
                id="custom-model-id"
                value={customModelId}
                onChange={(event) => setCustomModelId(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-model-description">Description</Label>
            <Textarea
              id="custom-model-description"
              value={customDescription}
              onChange={(event) => setCustomDescription(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="custom-model-premium"
              checked={customPremium}
              onCheckedChange={(checked) => setCustomPremium(Boolean(checked))}
            />
            <Label htmlFor="custom-model-premium" className="text-sm">
              Mark as premium
            </Label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="custom-input-price">Input price (micros)</Label>
              <Input
                id="custom-input-price"
                type="number"
                min={0}
                value={customInputPrice}
                onChange={(event) => setCustomInputPrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-output-price">Output price (micros)</Label>
              <Input
                id="custom-output-price"
                type="number"
                min={0}
                value={customOutputPrice}
                onChange={(event) => setCustomOutputPrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-reasoning-price">
                Reasoning price (micros)
              </Label>
              <Input
                id="custom-reasoning-price"
                type="number"
                min={0}
                value={customReasoningPrice}
                onChange={(event) =>
                  setCustomReasoningPrice(event.target.value)
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCreateCustomModel}
              disabled={createCustomModel.isPending}
            >
              Add model
            </Button>
            <p className="text-xs text-muted-foreground">
              Pricing fields are optional metadata for cost estimates.
            </p>
          </div>

          {customModels.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        {model.description && (
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {model.modelId}
                    </TableCell>
                    <TableCell>{model.premium ? "Premium" : "Basic"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCustomModel(model.id)}
                        disabled={deleteCustomModel.isPending}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
