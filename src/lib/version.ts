export const appVersion = "7.2.2";
export const appCodename = "Iron Wolf";
export const appDate = "2026-04-18";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
