export const appVersion = "7.5.0";
export const appCodename = "Crystal Tiger";
export const appDate = "2026-07-10";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
