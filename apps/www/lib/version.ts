const version = "4.0.0-beta.2";
const codename = "Flea"
const date = "2025-05-14"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}