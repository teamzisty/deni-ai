export type ThemeName = "light" | "dark" | "system" | "default" | "t3-chat" | "tangerine" | "mono";

type ThemePreset = {
  key: ThemeName;
  preview?: string[];
};

export const themePresets: ThemePreset[] = [
  {
    key: "default",
  },
  {
    key: "t3-chat",
    preview: ["bg-[#ec4899]", "bg-[#a855f7]", "bg-[#6b7280]"],
  },
  {
    key: "tangerine",
    preview: ["bg-[#fb923c]", "bg-[#f97316]", "bg-[#1f2937]"],
  },
  {
    key: "mono",
    preview: ["bg-[#0b0b0f]", "bg-[#27272a]", "bg-[#a1a1aa]"],
  },
];

export function getPreset(key: ThemeName) {
  return themePresets.find((preset) => preset.key === key);
}
