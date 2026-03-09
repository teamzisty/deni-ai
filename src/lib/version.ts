export const appVersion = "6.6.1";
export const appCodename = "Shadow Arrow";
export const appDate = "2026-3-7";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
