import sqlite3
import pandas as pd

def ingest_csv_to_sql(db_path: str, csv_path: str, table_name: str):
    df = pd.read_csv(csv_path, header=None)
    df.columns = ['level', 'heading', 'content']

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
    cursor.execute(f'''
        CREATE TABLE {table_name} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT,
            heading TEXT,
            content TEXT
        )
    ''')

    for _, row in df.iterrows():
        cursor.execute(f'''
            INSERT INTO {table_name} (level, heading, content)
            VALUES (?, ?, ?)
        ''', (row['level'], row['heading'], row['content']))

    conn.commit()
    conn.close()

