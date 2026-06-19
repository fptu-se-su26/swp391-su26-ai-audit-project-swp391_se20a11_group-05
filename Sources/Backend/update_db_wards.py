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

    # Update the ward mapping for feedbacks that belong to Hòa Xuân
    tracking_codes = ('DN-102198', 'DN-102263', 'DN-102091', 'DN-101934')
    cursor.execute("""
        UPDATE feedbacks
        SET ward_id = 109, ward_name = 'Hòa Xuân'
        WHERE tracking_code IN %s
    """, (tracking_codes,))
    print(f"Updated {cursor.rowcount} rows in feedbacks table.")

    conn.commit()
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
