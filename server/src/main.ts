import { startApp } from "./app"
import { jwtSecret } from "../settings"

startApp({
  jwtSecret
});