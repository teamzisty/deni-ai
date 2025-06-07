const version = "4.1.0-beta.6";
const codename = "Bloom"
const date = "2025-06-04";

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}