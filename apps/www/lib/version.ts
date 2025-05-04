const version = "3.2.1";
const codename = "Mosquito"
const date = "2025-05-05"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}