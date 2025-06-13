# backend/core/project_registry.py

import os
import json

PROJECTS_DIR = os.path.join(os.path.dirname(__file__), "../../projects")
os.makedirs(PROJECTS_DIR, exist_ok=True)

def get_project_path(name: str) -> str:
    return os.path.join(PROJECTS_DIR, name)

def list_projects():
    return [p for p in os.listdir(PROJECTS_DIR) if os.path.isdir(get_project_path(p))]

def create_project(name: str):
    path = get_project_path(name)
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, "metadata.json"), "w") as f:
        json.dump({"name": name, "sql_tables": [], "buckets": []}, f)
    return {"status": "created", "project": name}

def get_project_metadata(name: str):
    path = os.path.join(get_project_path(name), "metadata.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No project named '{name}'")
    with open(path) as f:
        return json.load(f)

