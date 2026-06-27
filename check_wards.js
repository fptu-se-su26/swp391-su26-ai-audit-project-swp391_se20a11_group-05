const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://postgres.lbzcfhavzhfmeqjncsno:thanhbinh13405@@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT username, role, ward_id FROM users WHERE role = 'POLICE' ORDER BY id LIMIT 10");
  console.log("Sample POLICE users:", res.rows);
  
  const countRes = await client.query("SELECT COUNT(DISTINCT ward_id) FROM users WHERE role = 'POLICE'");
  console.log("Distinct ward_ids for POLICE:", countRes.rows[0].count);
  
  await client.end();
}

main().catch(console.error);
