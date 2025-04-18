const version = "3.0.0";
const codename = "Poodle"
const date = "2025-04-18"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}