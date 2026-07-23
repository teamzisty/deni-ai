export const appVersion = "7.6.1";
export const appCodename = "Emerald Tiger";
export const appDate = "2026-07-23";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
