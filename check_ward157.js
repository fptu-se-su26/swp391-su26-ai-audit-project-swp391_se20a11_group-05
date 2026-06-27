const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.lbzcfhavzhfmeqjncsno:thanhbinh13405@@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT * FROM wards WHERE id = 157");
  console.log("Ward 157:", res.rows);
  await client.end();
}

main().catch(console.error);
