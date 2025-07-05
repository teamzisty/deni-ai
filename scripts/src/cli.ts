import { Command } from "commander";
import { dependenciesUpdater } from "./dependencies-updater";
import { prodBuildWithTime } from "./prod-build-with-time";

const program = new Command();

program
  .name("bun deni")
  .description("CLI for Deni AI project management")
  .version("1.0.0");

// Dependencies category
const depCommand = program
  .command("dep")
  .description("Dependencies management");

depCommand
  .command("update")
  .description("Update dependencies")
  .action(async () => {
    try {
      await dependenciesUpdater();
    } catch (error) {
      console.error("Process `dependenciesUpdater` failed:", error);
      process.exit(1);
    }
  });

// Build category (renamed from tests)
const testsCommand = program.command("tests").description("Test management");

const buildCommand = testsCommand
  .command("build")
  .description("Production build with time measurement")
  .option("-t, --turbopack", "Use turbopack for builds")
  .action(async (options) => {
    try {
      prodBuildWithTime({ turbopack: options.turbopack });
    } catch (error) {
      console.error("Failed to run production build:", error);
      process.exit(1);
    }
  });

program.parse();
