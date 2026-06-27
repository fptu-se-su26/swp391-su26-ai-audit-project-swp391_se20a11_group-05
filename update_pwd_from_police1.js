const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.lbzcfhavzhfmeqjncsno:thanhbinh13405@@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT password FROM users WHERE username = 'Police1'");
  const hash = res.rows[0].password;
  await client.query("UPDATE users SET password = $1 WHERE username = 'Police157'", [hash]);
  console.log("Password copied from Police1 to Police157");
  await client.end();
}

main().catch(console.error);
