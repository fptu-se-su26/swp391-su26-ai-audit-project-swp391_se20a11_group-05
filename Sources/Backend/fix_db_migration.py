import psycopg2

SQL_QUERIES = [
    # 1. Feedbacks table - priority column
    "ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS priority VARCHAR(20);",
    "UPDATE feedbacks SET priority = 'MEDIUM' WHERE priority IS NULL;",
    "ALTER TABLE feedbacks ALTER COLUMN priority SET DATA TYPE VARCHAR(20);",
    "ALTER TABLE feedbacks ALTER COLUMN priority SET DEFAULT 'MEDIUM';",
    "ALTER TABLE feedbacks ALTER COLUMN priority SET NOT NULL;",

    # 2. Feedbacks table - receiver_type column
    "ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS receiver_type VARCHAR(20);",
    "UPDATE feedbacks SET receiver_type = 'WARD_STAFF' WHERE receiver_type IS NULL;",
    "ALTER TABLE feedbacks ALTER COLUMN receiver_type SET DATA TYPE VARCHAR(20);",
    "ALTER TABLE feedbacks ALTER COLUMN receiver_type SET DEFAULT 'WARD_STAFF';",
    "ALTER TABLE feedbacks ALTER COLUMN receiver_type SET NOT NULL;",

    # 3. Wards table - is_active column
    "ALTER TABLE wards ADD COLUMN IF NOT EXISTS is_active BOOLEAN;",
    "UPDATE wards SET is_active = TRUE WHERE is_active IS NULL;",
    "ALTER TABLE wards ALTER COLUMN is_active SET DEFAULT TRUE;",
    "ALTER TABLE wards ALTER COLUMN is_active SET NOT NULL;",

    # 4. Wards table - city_name column
    "ALTER TABLE wards ADD COLUMN IF NOT EXISTS city_name VARCHAR(100);",
    "UPDATE wards SET city_name = 'Da Nang' WHERE city_name IS NULL;",
    "ALTER TABLE wards ALTER COLUMN city_name SET DATA TYPE VARCHAR(100);",
    "ALTER TABLE wards ALTER COLUMN city_name SET DEFAULT 'Da Nang';",
    "ALTER TABLE wards ALTER COLUMN city_name SET NOT NULL;",

    # 5. Wards table - type column
    "ALTER TABLE wards ADD COLUMN IF NOT EXISTS type VARCHAR(30);",
    "UPDATE wards SET type = 'WARD' WHERE type IS NULL;",
    "ALTER TABLE wards ALTER COLUMN type SET DATA TYPE VARCHAR(30);",
    "ALTER TABLE wards ALTER COLUMN type SET DEFAULT 'WARD';",
    "ALTER TABLE wards ALTER COLUMN type SET NOT NULL;",

    # 6. Wards table - ward_code column
    "ALTER TABLE wards ADD COLUMN IF NOT EXISTS ward_code VARCHAR(50);",
    "UPDATE wards SET ward_code = 'WARD_' || id WHERE ward_code IS NULL;",
    "ALTER TABLE wards ALTER COLUMN ward_code SET DATA TYPE VARCHAR(50);",
    "ALTER TABLE wards ALTER COLUMN ward_code SET NOT NULL;",
    
    # 7. Ensure ward_code has UNIQUE constraint if not already present
    # We execute this in a separate block or check if it exists first
]

def run_queries(conn_params, name):
    print(f"Connecting to {name} database...")
    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        for idx, query in enumerate(SQL_QUERIES, 1):
            try:
                cursor.execute(query)
                print(f"[{name}] Query {idx} executed successfully.")
            except Exception as q_err:
                print(f"[{name}] Error executing query {idx} ({query}): {q_err}")
                conn.rollback()
        
        # Add UNIQUE constraint to ward_code if needed
        try:
            cursor.execute("ALTER TABLE wards ADD CONSTRAINT unique_ward_code UNIQUE (ward_code);")
            print(f"[{name}] Added unique constraint to ward_code.")
        except Exception as u_err:
            print(f"[{name}] Note: unique_ward_code constraint may already exist. ({u_err})")
            conn.rollback()

        conn.commit()
        cursor.close()
        conn.close()
        print(f"[{name}] Database update completed successfully.")
    except Exception as e:
        print(f"[{name}] Failed to connect or execute updates: {e}")

if __name__ == "__main__":
    # 1. Local PostgreSQL RAG DB
    local_params = {
        "host": "localhost",
        "port": 5432,
        "database": "ragdb",
        "user": "postgres",
        "password": "postgres"
    }
    
    # 2. Remote Supabase DB
    supabase_params = {
        "host": "aws-1-ap-northeast-2.pooler.supabase.com",
        "port": 6543,
        "database": "postgres",
        "user": "postgres.lbzcfhavzhfmeqjncsno",
        "password": "thanhbinh13405@"
    }
    
    run_queries(local_params, "LOCAL")
    print("-" * 50)
    run_queries(supabase_params, "SUPABASE")
