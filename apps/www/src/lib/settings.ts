// Legacy settings file - kept for compatibility
// The main settings logic is now in /hooks/use-settings.tsx

export interface UserSettings {
  advancedSearch: boolean;
  autoScroll: boolean;
  privacyMode: boolean;
  hubs: boolean;
  bots: boolean;
  branch: boolean;
  conversationsPrivacyMode: boolean;
}

export const defaultSettings: UserSettings = {
  advancedSearch: false,
  autoScroll: true,
  privacyMode: false,
  bots: true,
  hubs: true,
  branch: true,
  conversationsPrivacyMode: false,
};
