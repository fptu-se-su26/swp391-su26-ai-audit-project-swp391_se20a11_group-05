const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const client = new Client({
  connectionString: "postgresql://postgres.lbzcfhavzhfmeqjncsno:thanhbinh13405@@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const hash = bcrypt.hashSync("123456", 10);
  await client.query("UPDATE users SET password = $1 WHERE username = 'Police157'", [hash]);
  console.log("Password updated to 123456");
  await client.end();
}

main().catch(console.error);
