import bcrypt
import psycopg2

password = b"Police@157"
salt = bcrypt.gensalt(rounds=10)
hashed = bcrypt.hashpw(password, salt)
hashed_str = hashed.decode('utf-8')

conn = psycopg2.connect(
    host="aws-1-ap-northeast-2.pooler.supabase.com",
    port=6543,
    user="postgres.lbzcfhavzhfmeqjncsno",
    password="thanhbinh13405@",
    dbname="postgres"
)
cur = conn.cursor()

cur.execute("UPDATE users SET password = %s WHERE username = 'Police157'", (hashed_str,))
conn.commit()

cur.close()
conn.close()

print("Password updated back to Police@157")
