import { User } from "firebase/auth";

export interface followedInfoInterface {
  [uid: string]: {followed: boolean};
}

export interface UserDataInterface {
  followersInfo?: {
    [uid: string]: {followed: boolean};
  },
  followedInfo?: {
    [uid: string]: {followed: boolean};
  }
  paid: string;
  bio: string | null;
  image: string | null;
  verified: boolean;
  checkmarkState: boolean;
  isStaff: boolean;
  username: string;
  uid: string;
  banned: boolean;
  banReason?: string;
  followers: number;
  handle?: string;
  highlightActive: boolean;
}

export interface MessageDataInterface {
  username: string;
  replyTo?: number;
  message: string;
  paid: string;
  uid: string;
  edited: boolean;
  time: string;
  id: string;
  favorite: number;
  isSystemMessage: boolean;
  image?: string;
}

export interface MessageElementDataInterface {
  userData: UserDataInterface;
  messageData: MessageDataInterface;
  user: User;
  userSettings: UserSettingsInterface;
  isStaff: boolean;
}

export interface SubscriptionDataInterface {
  expiryDate: number;
  lastChecked: number;
  isExpired: boolean;
  id: string;
  plan: string;
  isStaff: boolean;
}

export function toBoolean(booleanStr: string): boolean {
  return booleanStr.toLowerCase() === "true";
}

export interface UserSettingsInterface {
  available: boolean;
  markdown: boolean;
  highlight: boolean;
  hide_checkmark: boolean;
  edit: boolean;
  version: string;
}

export function returnSettingsJson() {
  const settings = {
    available: true,
    hide_checkmark: false,
    highlight: false,
    edit: false,
    version: "1.0",
    markdown: true,
  };
  // if (window.localStorage.getItem("raichat-settings-version") !== "1.0") {
  //   window.localStorage.clear();
  //   window.localStorage.setItem("raichat-settings-available", "true");
  //   window.localStorage.setItem("raichat-hide-checkmark", "false");
  //   window.localStorage.setItem("raichat-highlight", "false");
  //   window.localStorage.setItem("raichat-settings-version", "1.0");
  //   window.localStorage.setItem("raichat-markdown", "true");
  //   window.sessionStorage.setItem("raichat-settings-reseted", "true");
  // }
  return settings;
}

interface RaiChatBuildInfo {
  version: string;
  fullInfo: string;
  type: "web" | "desktop";
  environment: string;
}

const version = "1.0.0";
const type = "web";
const environment = process.env.NODE_ENV || "production";

export const raiChatBuildInfo: RaiChatBuildInfo = {
  version: version,
  fullInfo: `raichat-${version}-${type}`,
  type: type,
  environment
};