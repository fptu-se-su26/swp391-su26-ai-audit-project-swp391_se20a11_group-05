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

    cursor.execute("""
        SELECT u.id, u.username, u.full_name, u.role, w.id, w.name
        FROM users u
        LEFT JOIN wards w ON u.ward_id = w.id
        WHERE u.role = 'WARD_STAFF' OR u.username ILIKE '%staff%'
    """)
    rows = cursor.fetchall()
    with open("users_output.txt", "w", encoding="utf-8") as f:
        f.write("WARD STAFF USERS IN DATABASE:\n")
        for row in rows:
            f.write(f"ID: {row[0]}, Username: {row[1]}, Name: {row[2]}, Role: {row[3]}, WardID: {row[4]}, Ward: {row[5]}\n")
    print("Done writing to users_output.txt")

    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
