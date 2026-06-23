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
        SELECT ward_id, ward_name, COUNT(*), 
               SUM(CASE WHEN category_code IN ('URBAN_INFRASTRUCTURE', 'ENVIRONMENT', 'CONSTRUCTION') THEN 1 ELSE 0 END) as allowed_categories_count
        FROM feedbacks
        GROUP BY ward_id, ward_name
        ORDER BY COUNT(*) DESC
    """)
    rows = cursor.fetchall()
    with open("wards_feedback_counts.txt", "w", encoding="utf-8") as f:
        f.write("FEEDBACK COUNTS BY WARD:\n")
        for row in rows:
            f.write(f"WardID: {row[0]}, WardName: {row[1]}, Total Feedbacks: {row[2]}, Managed by Ward Staff: {row[3]}\n")
    print("Done writing to wards_feedback_counts.txt")

    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
