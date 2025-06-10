# backend/services/sql_conversion.py

import sqlite3
import pandas as pd
import os

def ingest_csv_to_sql(project_name: str, file_path: str):
    db_path = f"projects/{project_name}/reference_documents.db"
    os.makedirs(f"projects/{project_name}", exist_ok=True)

    df = pd.read_csv(file_path)
    table_name = os.path.splitext(os.path.basename(file_path))[0]

    conn = sqlite3.connect(db_path)
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    conn.close()

    return table_name

