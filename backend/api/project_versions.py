from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
import time
import json

router = APIRouter()
PROJECTS_DIR = "projects"

# -------------------------------
# Pydantic Models
# -------------------------------

class VersionMetadata(BaseModel):
    selectedSources: dict
    customizations: Optional[dict] = {}
    dataSourcesCount: Optional[int] = 0

class VersionCreateRequest(BaseModel):
    name: str
    focus: Optional[str] = ""
    prompt: str
    result: str
    metadata: VersionMetadata

class VersionUpdateRequest(BaseModel):
    name: Optional[str]
    focus: Optional[str]
    prompt: Optional[str]
    result: Optional[str]
    metadata: Optional[VersionMetadata]

# -------------------------------
# Internal Helpers
# -------------------------------

def get_db_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, project_id, "project.db")

def ensure_versions_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS versions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            focus TEXT,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            prompt TEXT NOT NULL,
            result TEXT NOT NULL,
            metadata_json TEXT,
            FOREIGN KEY (project_id) REFERENCES projects (name)
        );
    """)
    conn.commit()

# -------------------------------
# Public Utility: Save Version
# -------------------------------

def save_version_to_db(
    project_id: str,
    version_id: str,
    version_type: str,
    name: str,
    focus: str,
    prompt: str,
    result: str,
    metadata_json: dict
):
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Project {project_id} not found")

    conn = sqlite3.connect(db_path)
    ensure_versions_table(conn)

    print("[DEBUG] Saving version to DB")
    print(f"  ID: {version_id}")
    print(f"  Project: {project_id}")
    print(f"  Type: {version_type}")
    print(f"  Name: {name}")
    print(f"  Prompt: {prompt[:60]}...")
    print(f"  Metadata: {json.dumps(metadata_json)[:80]}...")

    conn.execute("""
        INSERT INTO versions (id, project_id, type, name, focus, prompt, result, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        version_id,
        project_id,
        version_type,
        name,
        focus,
        prompt,
        result,
        json.dumps(metadata_json)
    ))

    conn.commit()
    print("[DEBUG] Version committed successfully.")
    conn.close()

# -------------------------------
# Routes: CRUD for Versions
# -------------------------------

@router.post("/projects/{project_id}/versions/{version_type}")
def create_version(project_id: str, version_type: str, payload: VersionCreateRequest):
    version_id = f"{version_type}_{int(time.time())}"
    try:
        save_version_to_db(
            project_id=project_id,
            version_id=version_id,
            version_type=version_type,
            name=payload.name,
            focus=payload.focus or "",
            prompt=payload.prompt,
            result=payload.result,
            metadata_json=payload.metadata.dict()
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"status": "success", "version_id": version_id}

@router.get("/projects/{project_id}/versions/{version_type}")
def list_versions(project_id: str, version_type: str):
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Project not found")

    conn = sqlite3.connect(db_path)
    ensure_versions_table(conn)
    cur = conn.cursor()

    cur.execute("SELECT * FROM versions WHERE project_id=? AND type=? ORDER BY created DESC", (project_id, version_type))
    rows = cur.fetchall()
    conn.close()

    keys = ["id", "project_id", "type", "name", "focus", "created", "prompt", "result", "metadata_json"]
    return [dict(zip(keys, row)) for row in rows]

@router.put("/projects/{project_id}/versions/{version_id}")
def update_version(project_id: str, version_id: str, payload: VersionUpdateRequest):
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Project not found")

    conn = sqlite3.connect(db_path)
    ensure_versions_table(conn)
    cur = conn.cursor()

    cur.execute("SELECT * FROM versions WHERE id=? AND project_id=?", (version_id, project_id))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="Version not found")

    updates = []
    values = []

    if payload.name:
        updates.append("name=?")
        values.append(payload.name)
    if payload.focus:
        updates.append("focus=?")
        values.append(payload.focus)
    if payload.prompt:
        updates.append("prompt=?")
        values.append(payload.prompt)
    if payload.result:
        updates.append("result=?")
        values.append(payload.result)
    if payload.metadata:
        updates.append("metadata_json=?")
        values.append(json.dumps(payload.metadata.dict()))

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    values.append(version_id)
    values.append(project_id)

    conn.execute(f"UPDATE versions SET {', '.join(updates)} WHERE id=? AND project_id=?", values)
    conn.commit()
    conn.close()
    return {"status": "updated"}

@router.delete("/projects/{project_id}/versions/{version_id}")
def delete_version(project_id: str, version_id: str):
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Project not found")

    conn = sqlite3.connect(db_path)
    ensure_versions_table(conn)

    conn.execute("DELETE FROM versions WHERE id=? AND project_id=?", (version_id, project_id))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

