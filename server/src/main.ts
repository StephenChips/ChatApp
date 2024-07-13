import { startApp } from "./app"
import { jwtSecret, databaseConfig } from "../settings"

startApp({
  jwtSecret,
  databaseConfig,
  port: 8080
})