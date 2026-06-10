export const appVersion = "7.4-beta.1";
export const appCodename = "Lunar Hawk";
export const appDate = "2026-05-26";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
