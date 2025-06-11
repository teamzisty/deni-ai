const version = "4.1.0-rc.1";
const codename = "Bloom";
const date = "2025-06-11";

export const buildInfo = {
  version,
  codename,
  date,
  type: process.env.NODE_ENV || "development",
};
