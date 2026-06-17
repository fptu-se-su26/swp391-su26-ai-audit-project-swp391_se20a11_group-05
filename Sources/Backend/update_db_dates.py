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

    # Update all feedbacks' timestamps to the current database time
    cursor.execute("""
        UPDATE feedbacks
        SET created_at = NOW(), submitted_at = NOW(), updated_at = NOW()
    """)
    print(f"Updated timestamps for {cursor.rowcount} rows in feedbacks table.")

    conn.commit()
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
