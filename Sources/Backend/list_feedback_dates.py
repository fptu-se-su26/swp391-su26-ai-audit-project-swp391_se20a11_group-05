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
        SELECT id, tracking_code, created_at, ward_id, category_code, status
        FROM feedbacks
        ORDER BY created_at DESC
        LIMIT 10
    """)
    rows = cursor.fetchall()
    print("TOP 10 FEEDBACKS:")
    for row in rows:
        print(f"ID: {row[0]}, Code: {row[1]}, CreatedAt: {row[2]}, WardID: {row[3]}, Category: {row[4]}, Status: {row[5]}")

    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
