export const appVersion = "7.3";
export const appCodename = "Thunder Falcon";
export const appDate = "2026-05-24";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
