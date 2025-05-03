const version = "3.2.0";
const codename = "Bloodhound"
const date = "2025-04-27"

export const buildInfo = {
    version,
    codename,
    date,
    type: process.env.NODE_ENV || "development"
}