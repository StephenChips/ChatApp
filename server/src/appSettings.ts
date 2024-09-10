import Joi = require("joi");

interface AppSettings {
  readonly jwtSecret: string;
  readonly postgreSQL: {
    user: string;
    password: string;
    databse: string;
    host: string;
    port: number;
  }
  readonly http: {
    port: number;
  }
  readonly https: {
    port: number;
    certPath: string;
    keyPath: string;
  }
}

const settingsJSONSchema = Joi.object({
  jwtSecret: Joi.string(),

  postgreSQL: Joi.object({
    user: Joi.string(),
    password: Joi.string(),
    database: Joi.string(),
    host: Joi.string().default("127.0.0.1"),
    port: Joi.number().default(5432),
  }).options({ presence: "required" }),

  http: Joi.object({
    port: Joi.number().default(80)
  }),

  https: Joi.object({
    port: Joi.number().default(443),
    certPath: Joi.string(),
    keyPath: Joi.string(),
  })
    .options({ presence: "required" })
    .optional(),
});

function initAppSettings(): AppSettings {
  const settingsJSON = require("../settings.json");

  Joi.assert(settingsJSON, settingsJSONSchema, "The settings.json is invalid: ");

  return settingsJSON;
}

export const settings = initAppSettings();

export function httpsEnabled() {
  return settings.https !== undefined;
}
