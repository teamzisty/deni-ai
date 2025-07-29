#!/usr/bin/env bun

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { no } from "zod/v4/locales";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

interface ProjectDir {
  path: string;
  name: string;
}

// Define all project directories that need updating
const projectDirectories: ProjectDir[] = [
  { path: ".", name: "Root" },
  { path: "apps/www", name: "Web App" },
  { path: "apps/docs", name: "Docs App" },
  { path: "packages/supabase-config", name: "Supabase Config Package" },
  { path: "packages/typescript-config", name: "TypeScript Config Package" },
  { path: "packages/eslint-config", name: "ESLint Config Package" },
  {
    path: "packages/voids-ai-provider",
    name: "Voids AI Provider Package",
  },
  { path: "scripts", name: "Scripts" },
];

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function hasPackageJson(dirPath: string): boolean {
  return existsSync(join(dirPath, "package.json"));
}

function updateDependencies(projectDir: ProjectDir): {
  success: boolean;
  noChanges?: boolean;
  error?: string;
} {
  const { path, name } = projectDir;

  if (!hasPackageJson(path)) {
    return { success: false, error: "No package.json found" };
  }

  try {
    log(`\n=> Updating dependencies for ${name} (${path})...`, "cyan");

    const command = "bun update --latest";
    const output = execSync(command, {
      cwd: path,
      stdio: "pipe",
      encoding: "utf8",
    });

    log(`=> Successfully updated ${name}`, "green");

    // Show abbreviated output
    const lines = output.split("\n");
    const importantLines = lines.filter(
      (line) =>
        line.includes("updated") ||
        line.includes("installed") ||
        line.includes("packages") ||
        line.includes("done"),
    );
    const noChanges = lines.some((line) => line.includes("(no changes)"));

    if (importantLines.length > 0) {
      log(`   ${importantLines.slice(-2).join("\n   ")}`, "yellow");
    }

    return { success: true, noChanges };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`L Failed to update ${name}: ${errorMessage}`, "red");
    return { success: false, error: errorMessage };
  }
}

async function main() {
  log("=> Starting dependency updates for all projects...", "bright");
  log(`Found ${projectDirectories.length} projects to update\n`, "blue");

  const results: Array<{
    project: ProjectDir;
    success: boolean;
    noChanges?: boolean;
    error?: string;
  }> = [];

  for (const projectDir of projectDirectories) {
    const result = updateDependencies(projectDir);
    results.push({ project: projectDir, ...result });
  }

  // Summary
  log("\n" + "=".repeat(60), "bright");
  log("=> SUMMARY", "bright");
  log("=".repeat(60), "bright");

  const successful = results.filter((r) => r.success);
  const noChanges = successful.filter((r) => r.noChanges);
  const failed = results.filter((r) => !r.success);

  log(`> Successful updates: ${successful.length}`, "green");
  log(
    `> Failed updates: ${failed.length}`,
    failed.length > 0 ? "red" : "green",
  );
  log(`> No changes: ${noChanges.length}`, "yellow");

  if (successful.length - noChanges.length > 0) {
    log("\n> Successfully updated:", "green");
    successful.forEach(({ project }) => {
      if (noChanges.some((r) => r.project.path === project.path)) return;
      log(`   " ${project.name} (${project.path})`, "green");
    });
  }

  if (noChanges.length > 0) {
    log("\n> No changes for:", "yellow");
    noChanges.forEach(({ project }) => {
      log(`   " ${project.name} (${project.path})`, "yellow");
    });
  }

  if (failed.length > 0) {
    log("\n> Failed to update:", "red");
    failed.forEach(({ project, error }) => {
      log(`   " ${project.name} (${project.path}): ${error}`, "red");
    });
  }

  log("\n<> Dependency update process completed!", "bright");

  if (failed.length > 0) {
    process.exit(1);
  }
}

export function dependenciesUpdater() {
  return main();
}

// Only run the script if it's executed directly, not when imported
if (import.meta.main) {
  main().catch((error) => {
    log(`=> Script failed: ${error.message}`, "red");
    process.exit(1);
  });
}
