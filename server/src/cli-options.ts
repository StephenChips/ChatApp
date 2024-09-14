import { program } from "commander";

program.option("--settings-file <path>", "Specify the app's settings file's path");

program.parse(process.argv);

export const cliOptions = program.opts();