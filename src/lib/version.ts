export const appVersion = "7.6.0";
export const appCodename = "Crystal Tiger";
export const appDate = "2026-07-11";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
