const version = "2.2.2";
const codename = "Sheepdog"
const date = "2025-04-05"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}