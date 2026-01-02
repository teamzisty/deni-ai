export const appVersion = "6.2";
export const appCodename = "Solar Hawk";
export const appDate = "2026-01-02";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
