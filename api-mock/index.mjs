import express from "express"
import api from "./api.mjs"

const app = express()

app.use("/api", api)

app.listen(9000, () => {
  console.log("The HTTP api mocking server has been kicked off.")
})
