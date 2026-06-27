import bcrypt
import psycopg2

password = b"Police@157"
# Use Spring Boot compatible bcrypt hashing (cost 10)
salt = bcrypt.gensalt(rounds=10)
hashed = bcrypt.hashpw(password, salt)
# Decode to string for database
hashed_str = hashed.decode('utf-8')

conn = psycopg2.connect("postgresql://postgres.lbzcfhavzhfmeqjncsno:thanhbinh13405@@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres")
cur = conn.cursor()

# Update Police157 and also any other Police account to be safe if I messed them up
cur.execute("UPDATE users SET password = %s WHERE username = 'Police157'", (hashed_str,))
conn.commit()

cur.close()
conn.close()

print("Password updated back to Police@157")
