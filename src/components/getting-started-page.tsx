"use client";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Computer,
  Cpu,
  Globe,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useThemePreset } from "@/hooks/use-theme-preset";
import { authClient } from "@/lib/auth-client";
import { type ThemeName, themePresets } from "@/lib/theme-presets";

const texts = ["Welcome", "to", "Deni", "AI"];
const segmentMs = 1000;
const totalMs = texts.length * segmentMs;
const showSetupDelay = totalMs + 600;

export default function GettingStartedPage() {
  const [showSetup, setShowSetup] = useState(false);
  // Preload session while the intro animation plays
  const { data: sessionData } = authClient.useSession();
  const preloadName = sessionData?.user?.name ?? "";
  const preloadImage =
    (sessionData?.user as { image?: string | null } | undefined)?.image ?? null;

  useEffect(() => {
    const timeout = setTimeout(() => setShowSetup(true), showSetupDelay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,hsl(220_70%_60%/.20),transparent),radial-gradient(1000px_500px_at_90%_10%,hsl(280_70%_60%/.16),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.06] mask-[radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)",
            backgroundSize: "24px_24px",
          }}
        />
      </div>

      <div
        className={`w-full px-4 ${
          showSetup
            ? "mx-auto max-w-2xl space-y-8"
            : "mx-auto max-w-xl text-center"
        }`}
      >
        {showSetup ? (
          <SetupScreen preloadName={preloadName} preloadImage={preloadImage} />
        ) : (
          <Intro />
        )}
      </div>
    </main>
  );
}

function Intro() {
  return (
    <div className="space-y-6">
      <div className="relative mx-auto w-full" style={{ height: 64 }}>
        {texts.map((text, index) => (
          <h1
            key={`${text}`} // do not use index as key to avoid remounting
            className="absolute left-1/2 top-1/2 w-full max-w-full -translate-x-1/2 -translate-y-1/2 transform text-2xl font-bold md:text-4xl lg:text-6xl tracking-tighter"
            style={{
              opacity: 0,
              animation: `fadeCycle ${totalMs}ms linear`,
              animationDelay: `${index * segmentMs}ms`,
            }}
          >
            {text}
          </h1>
        ))}
      </div>
    </div>
  );
}

function SetupScreen({
  preloadName,
  preloadImage,
}: {
  preloadName?: string;
  preloadImage?: string | null;
}) {
  const router = useRouter();
  const steps = [
    {
      key: "account",
      title: "Profile",
      description: "Set up your profile",
    },
    {
      key: "theme",
      title: "Theme",
      description: "Pick your chat vibe",
    },
    {
      key: "features",
      title: "Features",
      description: "A quick tour of what’s included",
    },
  ] as const;

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    onSelect();
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const canPrev = index > 0;
  const canNext = index < steps.length - 1;
  const percentage = useMemo(
    () => ((index + 1) / steps.length) * 100,
    [index, steps.length],
  );

  return (
    <>
      {/* Header */}
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
          Let’s get your space ready
        </h1>
        <p className="text-muted-foreground">
          Let’s set up the AI chatbot for yours.
        </p>
      </div>

      <Card className="overflow-hidden border-border/60 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-fade-in will-change-[transform,opacity]">
        <CardContent>
          <div className="mb-4 flex flex-col -mx-0.5">
            <h1 className="text-balance text-2xl font-semibold">
              {steps[index].title}
            </h1>
            <p className="text-muted-foreground">{steps[index].description}</p>
          </div>

          <Carousel
            opts={{ align: "start", loop: false }}
            setApi={setCarouselApi}
            className="w-full"
          >
            <CarouselContent>
              <CarouselItem className="py-2">
                <AccountStep
                  initialName={preloadName}
                  initialImage={preloadImage}
                />
              </CarouselItem>
              <CarouselItem className="py-2">
                <ThemeStep />
              </CarouselItem>
              <CarouselItem className="py-2">
                <FeaturesStep />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t md:flex-row md:items-center md:justify-between">
          <Button
            variant="outline"
            className="order-2 w-full md:order-1 md:w-auto"
            disabled={!canPrev}
            onClick={() => carouselApi?.scrollPrev()}
          >
            <ArrowLeft className="size-4" /> Previous
          </Button>
          <div className="order-1 flex w-full flex-1 items-center justify-center gap-3 md:order-2">
            <Progress value={percentage} className="hidden h-1 w-64 sm:block" />
            <Dots api={carouselApi} index={index} />
          </div>
          <Button
            className="order-3 w-full md:w-auto"
            onClick={() =>
              canNext ? carouselApi?.scrollNext() : router.push("/app")
            }
          >
            {canNext ? (
              <>
                Next <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                Finish <Sparkles className="size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

function AccountStep({
  initialName,
  initialImage,
}: {
  initialName?: string;
  initialImage?: string | null;
}) {
  const { isPending, refetch } = authClient.useSession();

  const [name, setName] = useState(initialName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialImage ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if ((initialName ?? "") && !name) setName(initialName ?? "");
  }, [initialName, name]);
  useEffect(() => {
    if (initialImage !== undefined && avatarUrl == null)
      setAvatarUrl(initialImage ?? null);
  }, [initialImage, avatarUrl]);

  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);
    try {
      const payload: Record<string, unknown> = {};
      if (name !== undefined) payload.name = name;
      // Allow null to clear avatar
      payload.image = avatarUrl ?? null;
      await authClient.updateUser(payload);
      refetch();
      setSavedMsg("Saved");
    } catch (_e) {
      setSavedMsg("Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="space-y-4">
        <Label>Profile image</Label>
        <Avatar className="size-20">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="avatar" />
          ) : (
            <AvatarFallback>
              {(name?.[0] ?? "D").toUpperCase()}
              {(name?.[1] ?? "A").toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            id="avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setAvatarUrl(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || saving}
          >
            Upload
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAvatarUrl(null)}
              disabled={isPending || saving}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Taro"
            disabled={isPending || saving}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {savedMsg && (
            <span className="text-xs text-muted-foreground">{savedMsg}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeStep() {
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const activeTheme = preset;
  const themes = themePresets;

  useEffect(() => {
    const isStandardTheme =
      theme === "light" || theme === "dark" || theme === "system";
    const isCustomPreset =
      preset === "t3-chat" || preset === "tangerine" || preset === "mono";
    if (isStandardTheme && !isCustomPreset) {
      setPreset(theme as ThemeName);
    }
  }, [preset, setPreset, theme]);

  const handleSelect = (value: ThemeName) => {
    setPreset(value);
  };

  return (
    <div className="w-full grid gap-6">
      <div className="w-full space-y-4">
        <div className="w-full flex items-center justify-between">
          <Label>Choose theme</Label>
          <Button
            size="sm"
            variant={"outline"}
            onClick={() => {
              if (theme === "light") setTheme("dark");
              else if (theme === "dark") setTheme("system");
              else setTheme("light");
            }}
          >
            {theme === "system" ? (
              <Computer className="size-4" />
            ) : theme === "light" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            {
              ((theme?.charAt(0).toUpperCase() as string) +
                theme?.slice(1)) as string
            }
          </Button>
        </div>

        <fieldset className="grid grid-cols-2 gap-4">
          {themes.map((t) => {
            const selected = activeTheme === t.key;
            return (
              <Button
                key={t.key}
                variant={selected ? "default" : "outline"}
                className={`flex flex-col items-start justify-between rounded-md border-2 p-4 text-left transition h-full ${
                  selected ? "border-primary" : "border-secondary"
                }`}
                onClick={() => handleSelect(t.key)}
                aria-pressed={selected}
              >
                <div className="flex w-full items-start justify-between">
                  <h3 className="font-semibold">{t.title}</h3>
                  {selected && (
                    <motion.span
                      layoutId="tick"
                      className="mt-0.5 inline-flex items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 p-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="flex w-full gap-1.5" aria-hidden>
                  {t.preview?.map((bar, _i) => (
                    <div
                      key={bar}
                      className={`h-1.5 flex-1 rounded-full ${bar}`}
                    />
                  ))}
                </div>
              </Button>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}

function FeaturesStep() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FeatureCard
        icon={Cpu}
        title="Latest Models"
        description="Access cutting-edge AI like GPT-5 and Claude Sonnet 4 for powerful, intelligent conversations."
      />
      <FeatureCard
        icon={Globe}
        title="Internet Search"
        description="Get real-time answers with live web search — even when built-in knowledge is limited."
      />
      <FeatureCard
        icon={ShieldCheck}
        title="Privacy"
        description="Protect your account with two-factor authentication and flexible data retention settings."
      />
      <FeatureCard
        icon={Sparkles}
        title="Feature-Rich"
        description="Generate images, organize chats into folders, and attach files seamlessly."
      />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 shadow-sm transition-all will-change-transform hover:bg-muted/40 data-[active=true]:animate-in data-[active=true]:fade-in-0 data-[active=true]:slide-in-from-bottom-2">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4" />
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Dots({ api, index }: { api: CarouselApi | null; index: number }) {
  const [snaps, setSnaps] = useState<number[]>([]);
  useEffect(() => {
    if (!api) return;
    setSnaps(api.scrollSnapList());
  }, [api]);
  return (
    <div className="flex items-center gap-1.5">
      {snaps.map((snap, i) => (
        <span
          key={snap}
          className={`h-1.5 w-4 rounded-full transition-colors ${i <= index ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function _PreferenceToggle({
  id,
  title,
  description,
  defaultChecked,
}: {
  id: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} aria-label={title} />
    </div>
  );
}

// (Checklist removed as requested)
