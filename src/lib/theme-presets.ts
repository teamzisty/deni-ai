export type ThemeName =
  | "light"
  | "dark"
  | "system"
  | "t3-chat"
  | "tangerine"
  | "mono";

type ThemePreset = {
  key: ThemeName;
  title: string;
  description: string;
  preview?: string[];
};

export const themePresets: ThemePreset[] = [
  {
    key: "t3-chat",
    title: "T3 Chat",
    description: "Pink & violet inspired chat vibe",
    preview: ["bg-[#ec4899]", "bg-[#a855f7]", "bg-[#6b7280]"],
  },
  {
    key: "tangerine",
    title: "Tangerine",
    description: "Bright, warm, and friendly",
    preview: ["bg-[#fb923c]", "bg-[#f97316]", "bg-[#1f2937]"],
  },
  {
    key: "mono",
    title: "Mono",
    description: "Neutral grayscale, minimal distractions",
    preview: ["bg-[#0b0b0f]", "bg-[#27272a]", "bg-[#a1a1aa]"],
  },
];

export function getPreset(key: ThemeName) {
  return themePresets.find((preset) => preset.key === key);
}
