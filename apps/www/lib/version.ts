const version = "2.2.0";
const codename = "Sheepdog"
const date = "2025-04-02"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}