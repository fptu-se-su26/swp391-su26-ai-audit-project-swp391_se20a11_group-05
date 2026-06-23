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

    with open("db_output.txt", "w", encoding="utf-8") as f:
        f.write("=== FEEDBACKS IN WARD 109 (Hòa Xuân) ===\n")
        cursor.execute("SELECT id, title, status, category_code, ward_id, created_at FROM feedbacks WHERE ward_id = 109")
        rows = cursor.fetchall()
        f.write(f"Total feedbacks in Ward 109: {len(rows)}\n")
        for row in rows:
            f.write(f"ID: {row[0]}, Title: {row[1]}, Status: {row[2]}, Category: {row[3]}, WardID: {row[4]}, CreatedAt: {row[5]}\n")

        f.write("\n=== DISTRICT AND WARD OF FEEDBACKS IN SEED FILE ===\n")
        cursor.execute("SELECT DISTINCT ward_id, ward_name, category_code FROM feedbacks")
        for row in cursor.fetchall():
            f.write(f"WardID: {row[0]}, WardName: {row[1]}, CategoryCode: {row[2]}\n")

    cursor.close()
    conn.close()
    print("Done writing to db_output.txt")
except Exception as e:
    print("Error:", e)
