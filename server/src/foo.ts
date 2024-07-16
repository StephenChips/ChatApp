import { Client } from "pg";


async function show() {
  const client = new Client({
    "user": "postgres",
    "password": "123456",
    "host": "localhost",
    "port": 5432,
    "database": "postgres"
  })
  
  await client.connect();
  const result = await client.query({ text: `SELECT * FROM chatapp.users WHERE id = $1`, values: [0] });
  console.log(result);
  client.end();
}

show();