const version = "3.2.0";
const codename = "Mosquito"
const date = "2025-05-03"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}