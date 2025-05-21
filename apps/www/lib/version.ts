const version = "4.0.0-rc.1";
const codename = "Flea"
const date = "2025-05-21"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}