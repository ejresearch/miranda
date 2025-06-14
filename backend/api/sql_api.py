# backend/api/sql_api.py

import os
import csv
import sqlite3
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional

router = APIRouter()

PROJECTS_DIR = "projects"

def get_db_path(project: str) -> str:
    return os.path.join(PROJECTS_DIR, project, "project.db")

# ---------- Upload CSV and Create Table ----------

@router.post("/tables/upload_csv")
async def upload_csv(project: str, table_name: str, file: UploadFile = File(...)):
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")

    contents = await file.read()
    decoded = contents.decode("utf-8").splitlines()
    reader = csv.reader(decoded)
    headers = next(reader)

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # Drop table if it exists
        cur.execute(f"DROP TABLE IF EXISTS {table_name}")
        # Create table
        columns = ", ".join([f"{h} TEXT" for h in headers])
        cur.execute(f"CREATE TABLE {table_name} ({columns})")

        # Insert rows
        for row in reader:
            placeholders = ", ".join(["?" for _ in row])
            cur.execute(f"INSERT INTO {table_name} VALUES ({placeholders})", row)

        conn.commit()
        return {"status": "success", "table": table_name, "project": project}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ---------- View Table (Optionally Filtered) ----------

@router.get("/tables/{table_name}")
async def get_table(project: str, table_name: str, column: Optional[str] = None, value: Optional[str] = None):
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        if column and value:
            cur.execute(f"SELECT * FROM {table_name} WHERE {column} = ?", (value,))
        else:
            cur.execute(f"SELECT * FROM {table_name}")
        
        rows = [dict(row) for row in cur.fetchall()]
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/tables/list")
async def list_tables(project: str):
    db_path = get_db_path(project)
    if not os.path.isfile(db_path):
        raise HTTPException(status_code=404, detail=f"Project database not found: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        # Avoid listing internal SQLite system tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        result = cur.fetchall()
        tables = [row[0] for row in result]
        return {"project": project, "tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to list tables: {str(e)}")
    finally:
        conn.close()

