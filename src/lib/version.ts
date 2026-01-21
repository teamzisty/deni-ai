export const appVersion = "6.3";
export const appCodename = "Obsidian Falcon";
export const appDate = "2026-01-21";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
