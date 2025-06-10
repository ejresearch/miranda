# backend/services/sql_utils.py
import os
import sqlite3

BASE_PROJECTS_DIR = "projects"

def get_project_db_path(project_name: str) -> str:
    project_dir = os.path.join(BASE_PROJECTS_DIR, project_name)
    os.makedirs(project_dir, exist_ok=True)

    db_path = os.path.join(project_dir, "project.db")
    if not os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        conn.close()

    return db_path

