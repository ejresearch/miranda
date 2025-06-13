# backend/api/project_manager.py

import os
PROJECTS_DIR = os.path.join(os.path.dirname(__file__), "../../projects")
from fastapi import APIRouter, HTTPException
from backend.core.project_registry import list_projects, create_project, get_project_metadata

router = APIRouter()

@router.get("/projects")
async def api_list_projects():
    return list_projects()

@router.post("/projects/new")
async def create_project(body: dict):
    name = body.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Project name required")

    project_path = os.path.join(PROJECTS_DIR, name)
    os.makedirs(project_path, exist_ok=True)

    # Create empty SQLite file
    db_path = os.path.join(project_path, "project.db")
    if not os.path.exists(db_path):
        open(db_path, "a").close()

    # Create LightRAG subfolder
    rag_path = os.path.join(project_path, "lightrag")
    os.makedirs(rag_path, exist_ok=True)

    return {"status": "created", "project": name}

@router.get("/projects/{name}")
async def get_project(name: str):
    path = os.path.join(PROJECTS_DIR, name)
    if not os.path.isdir(path):
        raise HTTPException(status_code=404, detail="Project not found")

    sql_path = os.path.join(path, "project.db")
    rag_path = os.path.join(path, "lightrag")

    return {
        "name": name,
        "sql_exists": os.path.exists(sql_path),
        "rag_contents": os.listdir(rag_path) if os.path.exists(rag_path) else []
    }

