import { UserDataInterface } from "./types";

export function getPlan(planId: string) {
  if (planId.includes("pro_")) {
    return "pro";
  } else if (planId.includes("premiumPlus_")) {
    return "premiumplus";
  } else if (planId.includes("premium_")) {
    return "premium";
  } else {
    return "free";
  }
}

export function isCheckmarker(userData: UserDataInterface) {
  const result =
    userData.paid != "free" &&
    userData.verified == true &&
    userData.checkmarkState === false;
  return result;
}

export function xssProtectedText(text: string) {
  text = text.replace(/&/g, "&amp;");
  text = text.replace(/"/g, "&quot;");
  text = text.replace(/'/g, "&#x27;");
  text = text.replace(/</g, "&lt;");
  text = text.replace(/>/g, "&gt;");

  return text;
}

export function isHighlightAvailable(userData: UserDataInterface) {
  return userData.paid != "free" && userData.highlightActive;
}
