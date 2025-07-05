import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const useTurbopack = process.argv.includes("-t");

const buildDir = path.join(__dirname, "../", "../", "apps", "www");

export function prodBuildWithTime({ turbopack }: { turbopack?: boolean }) {
  if (!fs.existsSync(buildDir)) {
    console.error(`Directory not found: ${buildDir}`);
    process.exit(1);
  }

  console.log(`cd ${buildDir}`);
  console.time("build time");

  const buildCommand = turbopack
    ? "bun run build --no-lint --turbopack"
    : "bun run build --no-lint";
  const logs = [
    `===== Starting build in ${buildDir} =====`,
    `Using command: ${buildCommand}`,
    `Turbopack mode: ${turbopack ? "Enabled" : "Disabled"}`,
    `========================================`,
  ];
  console.log(logs.join("\n"));

  try {
    execSync(buildCommand, {
      cwd: buildDir,
      stdio: "inherit",
    });
    console.timeEnd("build time");
  } catch (err) {
    console.error("An error occurred during the build process:");
    console.timeEnd("build time");
    process.exit(1);
  }
}

if (require.main === module) {
  prodBuildWithTime({ turbopack: useTurbopack });
}
