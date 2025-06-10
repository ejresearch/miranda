import sqlite3

def ingest_txt_to_sql(db_path: str, txt_path: str, table_name: str):
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()

    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
    cursor.execute(f'''
        CREATE TABLE {table_name} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chunk_number INTEGER,
            content TEXT
        )
    ''')

    for i, para in enumerate(paragraphs, start=1):
        cursor.execute(f'''
            INSERT INTO {table_name} (chunk_number, content)
            VALUES (?, ?)
        ''', (i, para))

    conn.commit()
    conn.close()

