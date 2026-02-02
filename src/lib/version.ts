export const appVersion = "6.4-beta.3";
export const appCodename = "Crimson Titan";
export const appDate = "2026-02-02";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
