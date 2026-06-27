import psycopg2

try:
    conn = psycopg2.connect(
        host="aws-1-ap-northeast-2.pooler.supabase.com",
        port=6543,
        database="postgres",
        user="postgres.lbzcfhavzhfmeqjncsno",
        password="thanhbinh13405@"
    )
    cursor = conn.cursor()

    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'wards'")
    cols = cursor.fetchall()
    print("Columns:", [c[0] for c in cols])

    cursor.execute("SELECT id, name, type FROM wards ORDER BY name LIMIT 10")
    rows = cursor.fetchall()
    print("Sample wards:")
    for row in rows:
        print(row)
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
