export const appVersion = "6.4-beta.1";
export const appCodename = "Crimson Titan";
export const appDate = "2026-01-22";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
