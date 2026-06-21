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
        SELECT id, tracking_code, title, address_details, ward_id, ward_name
        FROM feedbacks
        WHERE title ILIKE '%Hòa Xuân%' OR description ILIKE '%Hòa Xuân%' OR address_details ILIKE '%Hòa Xuân%'
    """)
    rows = cursor.fetchall()
    with open("find_hoa_xuan_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Found {len(rows)} feedbacks matching Hòa Xuân:\n")
        for row in rows:
            f.write(f"ID: {row[0]}, Code: {row[1]}, Title: {row[2]}, Address: {row[3]}, WardID: {row[4]}, WardName: {row[5]}\n")
    print("Done writing to find_hoa_xuan_output.txt")

    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
