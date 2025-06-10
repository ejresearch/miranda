# backend/table_api.py

from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict
import os
from core.sql_utils import csv_to_sqlite, create_table_with_columns, add_row_to_table, delete_row_by_id

router = APIRouter()

BASE_DIR = "projects"

def get_db_path(project_name: str) -> str:
    return os.path.join(BASE_DIR, project_name, "project.db")

# Endpoint: Upload CSV to create/overwrite a table
@router.post("/tables/upload_csv")
async def upload_csv(
    project_name: str = Form(...),
    table_name: str = Form(...),
    file: UploadFile = File(...)
):
    db_path = get_db_path(project_name)
    csv_path = os.path.join(BASE_DIR, project_name, file.filename)

    with open(csv_path, "wb") as f:
        content = await file.read()
        f.write(content)

    csv_to_sqlite(csv_path, db_path, table_name)
    return {"message": f"CSV uploaded and table '{table_name}' created."}

# Endpoint: Manually create a new table with column names
class CreateTableRequest(BaseModel):
    project_name: str
    table_name: str
    columns: List[str]

@router.post("/tables/create")
def create_table(req: CreateTableRequest):
    db_path = get_db_path(req.project_name)
    create_table_with_columns(db_path, req.table_name, req.columns)
    return {"message": f"Table '{req.table_name}' created with columns {req.columns}"}

# Endpoint: Add a row to a table
class AddRowRequest(BaseModel):
    project_name: str
    table_name: str
    row_data: Dict[str, str]

@router.post("/tables/add_row")
def add_row(req: AddRowRequest):
    db_path = get_db_path(req.project_name)
    add_row_to_table(db_path, req.table_name, req.row_data)
    return {"message": f"Row added to table '{req.table_name}'."}

# Endpoint: Delete a row by its SQLite rowid
class DeleteRowRequest(BaseModel):
    project_name: str
    table_name: str
    row_id: int

@router.post("/tables/delete_row")
def delete_row(req: DeleteRowRequest):
    db_path = get_db_path(req.project_name)
    delete_row_by_id(db_path, req.table_name, req.row_id)
    return {"message": f"Row {req.row_id} deleted from table '{req.table_name}'."}

