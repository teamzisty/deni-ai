const version = "4.1.0-beta.4";
const codename = "Bloom"
const date = "2025-05-29"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}