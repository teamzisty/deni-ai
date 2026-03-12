export const appVersion = "7.0-beta.1";
export const appCodename = "Phantom Phoenix";
export const appDate = "2026-3-12";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
