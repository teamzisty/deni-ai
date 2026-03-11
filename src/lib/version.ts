export const appVersion = "6.7";
export const appCodename = "Amber Cipher";
export const appDate = "2026-3-11";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
