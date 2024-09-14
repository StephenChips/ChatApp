import Joi = require("joi");
import { readFileSync } from "node:fs";
import { getSettingsFilePath } from "./cli-options";

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

function initAppSettings(): AppSettings {
  const settingsJSON = require(getSettingsFilePath());

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

  return settingsJSON;
}

export const settings = initAppSettings();

export function httpsEnabled() {
  return settings.https !== undefined;
}
