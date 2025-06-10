# --- [backend/services/sql_conversion.py] ---
import os, csv, sqlite3

def ingest_csv_to_sql(db_path: str, csv_path: str, table_name: str):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    with open(csv_path, newline='') as f:
        reader = csv.reader(f)
        headers = next(reader)
        cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')
        cursor.execute(f'CREATE TABLE "{table_name}" ({', '.join([f"{col} TEXT" for col in headers])})')
        cursor.executemany(f'INSERT INTO "{table_name}" VALUES ({', '.join(['?' for _ in headers])})', list(reader))
    conn.commit()
    conn.close()
    print(f"✅ Imported {csv_path} into {table_name}")

