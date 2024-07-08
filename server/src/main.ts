import { runSQLFile } from "./database"
import { resolve } from "path";

async function main() {
  const result = await runSQLFile(resolve(__dirname, "../sql/init.sql"));
  console.log(result)
}

main()
