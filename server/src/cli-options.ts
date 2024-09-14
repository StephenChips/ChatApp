import { program } from "commander";
import path = require("node:path");

program.option("--settings-file <path>", "Specify the app's settings file's path");

program.parse(process.argv);

const options = program.opts();

const ROOT_DIR = path.resolve(__dirname, "..");

export function getSettingsFilePath() {
  return path.resolve(ROOT_DIR, options.settingsFile ?? "./settings.json");
}
