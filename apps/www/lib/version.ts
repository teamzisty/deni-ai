const version = "4.1.0-beta.7";
const codename = "Bloom";
const date = "2025-06-10";

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}