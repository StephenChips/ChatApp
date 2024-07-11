import { startApp } from "./app"
import { jwtSecret, poolConfig } from "../settings"

startApp({
  jwtSecret,
  poolConfig,
  port: 8080
})