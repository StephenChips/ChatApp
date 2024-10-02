import Joi = require("joi");
import { readFileSync } from "node:fs";
import { cliOptions } from "./cli-options";
import path = require("node:path");

interface AppSettings {
  readonly jwtSecret: string;
  readonly postgreSQL: {
    user: string;
    password: string;
    databse: string;
    host: string;
    port: number;
  };
  readonly http: {
    port: number;
  };
  readonly https: {
    port: number;
    certPath: string;
    keyPath: string;
  };
}

const settingsJSONSchema = Joi.object({
  jwtSecret: Joi.string(),
  jwtSecretFile: Joi.string(),

  postgreSQL: Joi.object({
    user: Joi.string().required(),
    password: Joi.string(),
    passwordFile: Joi.string(),
    database: Joi.string().required(),
    host: Joi.string().default("127.0.0.1").required(),
    port: Joi.number().default(5432).required(),
  }).xor("password", "passwordFile"),

  http: Joi.object({
    port: Joi.number().default(80),
  }),

  https: Joi.object({
    port: Joi.number().default(443),
    certPath: Joi.string(),
    keyPath: Joi.string(),
  })
    .options({ presence: "required" })
    .optional(),
}).xor("jwtSecret", "jwtSecretFile");

let appSettings : AppSettings;

export function getSettingsFilePath() {
  const ROOT_DIR = path.resolve(__dirname, "../");
  const filepath = path.resolve(ROOT_DIR, cliOptions.settingsFile ?? "./settings.ts");
  return filepath;
}

export async function initAppSettings(): Promise<AppSettings> {
  const settingsFilePath = getSettingsFilePath();
  
  let settingsJSON 
  if (settingsFilePath.endsWith(".json")) {
    settingsJSON = require(settingsFilePath)
  } else if (/^.+\.(ts|js)$/.test(settingsFilePath)) {
    settingsJSON = (await import(settingsFilePath)).default;
  } else {
    console.error("Wrong setting file's extension. A setting file should be a .json, a .js or a .ts file.");
    process.exit(1);
  }

  try {
    Joi.assert(
      settingsJSON,
      settingsJSONSchema,
      "The settings.json is invalid: "
    );
  } catch (e) {
    const error = e as Error;
    console.error(error.message);
    process.exit(1);
  }

  if (settingsJSON.hasOwnProperty("jwtSecretFile")) {
    settingsJSON.jwtSecret = readFileSync(settingsJSON.jwtSecretFile, "utf-8");
    delete settingsJSON.jwtSecretFile;
  }

  if (settingsJSON.postgreSQL.hasOwnProperty("passwordFile")) {
    settingsJSON.postgreSQL.password = readFileSync(
      settingsJSON.postgreSQL.passwordFile,
      "utf-8"
    );
    delete settingsJSON.postgreSQL.passwordFile;
  }
  
  appSettings = settingsJSON;

  return appSettings;
}

export function getAppSettings() {
  return appSettings;
}

export function httpsEnabled() {
  return appSettings!.https !== undefined;
}
