export type ThemeName = "light" | "dark" | "system" | "default" | "t3-chat" | "tangerine" | "mono";

type ThemePreset = {
  key: ThemeName;
  preview?: string[];
};

export const themePresets: ThemePreset[] = [
  {
    key: "default",
    preview: ["bg-[#8b6f47]", "bg-[#d4a574]", "bg-[#f5e6d3]"],
  },
  {
    key: "t3-chat",
    preview: ["bg-[#ec4899]", "bg-[#a855f7]", "bg-[#fce7f3]"],
  },
  {
    key: "tangerine",
    preview: ["bg-[#fb923c]", "bg-[#f97316]", "bg-[#fef3e2]"],
  },
  {
    key: "mono",
    preview: ["bg-[#0b0b0f]", "bg-[#52525b]", "bg-[#a1a1aa]"],
  },
];

export function getPreset(key: ThemeName) {
  return themePresets.find((preset) => preset.key === key);
}
