export const appVersion = "7.1";
export const appCodename = "Solar Sphinx";
export const appDate = "2026-3-16";

const appHashPayload = [appVersion, appDate].join(":");
export const appHash = globalThis.btoa(appHashPayload);

export const versions = {
  version: appVersion,
  codename: appCodename,
  date: appDate,
  hash: appHash,
};
