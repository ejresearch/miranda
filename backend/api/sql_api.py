# backend/api/sql_api.py - COMPLETE REWRITE WITH ALL PHASE 1 ENHANCEMENTS

import os
import sqlite3
import tempfile
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any, Optional
import json

router = APIRouter()
PROJECTS_DIR = "projects"

def get_db_path(project: str) -> str:
    """Get the database path for a project"""
    return os.path.join(PROJECTS_DIR, project, "project.db")

def validate_project_exists(project: str) -> str:
    """Validate project exists and return database path"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist")
    return db_path

def execute_query_safely(db_path: str, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Execute a query safely with proper error handling"""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        if query.strip().upper().startswith('SELECT'):
            rows = cursor.fetchall()
            result = [dict(row) for row in rows]
        else:
            conn.commit()
            result = {"rows_affected": cursor.rowcount}
        
        conn.close()
        return result
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ===================================================================
# EXISTING ENDPOINTS (Enhanced)
# ===================================================================

@router.get("/list")
async def list_tables(project: str) -> Dict[str, List[str]]:
    """List all tables in project database"""
    db_path = validate_project_exists(project)
    
    try:
        result = execute_query_safely(
            db_path, 
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        table_names = [row['name'] for row in result]
        return {"tables": table_names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables/{table_name}")
async def get_table_data(project: str, table_name: str) -> Dict[str, Any]:
    """Get all data from a specific table"""
    db_path = validate_project_exists(project)
    
    try:
        # Check if table exists
        table_check = execute_query_safely(
            db_path,
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,)
        )
        
        if not table_check:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        
        # Get table data
        data = execute_query_safely(db_path, f'SELECT rowid, * FROM "{table_name}"')
        
        return {
            "table_name": table_name,
            "data": data,
            "row_count": len(data)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===================================================================
# PHASE 1 NEW ENDPOINT: CSV UPLOAD (Enhanced)
# ===================================================================

@router.post("/upload_csv")
async def upload_csv(
    project: str,
    table_name: str,
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """Upload CSV file to create and populate table - ENHANCED VERSION"""
    
    # Validate project exists
    db_path = validate_project_exists(project)
    
    # Validate file type
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV (.csv extension required)")
    
    # Validate table name
    if not table_name or not table_name.replace('_', '').isalnum():
        raise HTTPException(status_code=400, detail="Table name must be alphanumeric (underscores allowed)")
    
    tmp_path = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as tmp_file:
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Read and validate CSV with pandas
        try:
            df = pd.read_csv(tmp_path, encoding='utf-8')
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(tmp_path, encoding='latin-1')
            except:
                df = pd.read_csv(tmp_path, encoding='cp1252')
        
        # Validate CSV has data
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file contains no data")
        
        # Clean and validate column names
        original_columns = df.columns.tolist()
        cleaned_columns = []
        
        for col in original_columns:
            # Clean column name: strip whitespace, replace spaces with underscores
            clean_col = str(col).strip().replace(' ', '_').replace('-', '_')
            # Ensure alphanumeric + underscores only
            clean_col = ''.join(c for c in clean_col if c.isalnum() or c == '_')
            if not clean_col:
                clean_col = f"column_{len(cleaned_columns) + 1}"
            cleaned_columns.append(clean_col)
        
        # Rename columns in dataframe
        df.columns = cleaned_columns
        
        # Connect to database and create/populate table
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Drop table if exists (overwrite mode)
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')
            
            # Create table with cleaned column names
            column_defs = ", ".join([f'"{col}" TEXT' for col in cleaned_columns])
            create_query = f'CREATE TABLE "{table_name}" ({column_defs})'
            cursor.execute(create_query)
            
            # Insert data row by row with proper handling of NaN values
            rows_inserted = 0
            column_names = ", ".join([f'"{col}"' for col in cleaned_columns])
            placeholders = ", ".join(["?" for _ in cleaned_columns])
            insert_query = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})'
            
            for _, row in df.iterrows():
                # Convert NaN to empty string, everything else to string
                values = []
                for col in cleaned_columns:
                    value = row[col]
                    if pd.isna(value):
                        values.append("")
                    else:
                        values.append(str(value))
                
                cursor.execute(insert_query, values)
                rows_inserted += 1
            
            conn.commit()
            
            # Get final row count to verify
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            final_count = cursor.fetchone()[0]
            
        except sqlite3.Error as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            conn.close()
        
        return {
            "status": "success",
            "message": f"CSV uploaded successfully to table '{table_name}'",
            "table_name": table_name,
            "original_columns": original_columns,
            "cleaned_columns": cleaned_columns,
            "rows_inserted": rows_inserted,
            "final_row_count": final_count,
            "file_name": file.filename
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        # Cleanup temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass  # Ignore cleanup errors

# ===================================================================
# PHASE 1 NEW ENDPOINTS: ENHANCED TABLE CRUD OPERATIONS 
# ===================================================================

@router.post("/create")
async def create_empty_table(project: str, table_data: dict) -> Dict[str, Any]:
    """Create a new empty table with specified columns"""
    table_name = table_data.get("name")
    columns = table_data.get("columns", [])
    
    if not table_name or not columns:
        raise HTTPException(status_code=400, detail="Table name and columns required")
    
    # Validate table name
    if not table_name.replace('_', '').isalnum():
        raise HTTPException(status_code=400, detail="Table name must be alphanumeric (underscores allowed)")
    
    # Validate and clean column names
    cleaned_columns = []
    for col in columns:
        clean_col = str(col).strip().replace(' ', '_').replace('-', '_')
        clean_col = ''.join(c for c in clean_col if c.isalnum() or c == '_')
        if clean_col and clean_col not in cleaned_columns:
            cleaned_columns.append(clean_col)
    
    if not cleaned_columns:
        raise HTTPException(status_code=400, detail="At least one valid column name required")
    
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"Table '{table_name}' already exists")
        
        # Create table with cleaned column names
        column_defs = ", ".join([f'"{col}" TEXT' for col in cleaned_columns])
        cursor.execute(f'CREATE TABLE "{table_name}" ({column_defs})')
        
        conn.commit()
        conn.close()
        
        return {
            "status": "success", 
            "message": f"Table '{table_name}' created successfully",
            "table_name": table_name, 
            "columns": cleaned_columns,
            "column_count": len(cleaned_columns)
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/tables/{table_name}/rows")
async def add_table_row(project: str, table_name: str, row_data: dict) -> Dict[str, Any]:
    """Add a new row to existing table"""
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists and get columns
        cursor.execute(f"PRAGMA table_info({table_name})")
        column_info = cursor.fetchall()
        
        if not column_info:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        columns = [col[1] for col in column_info]  # col[1] is column name
        
        # Prepare insert values - use provided data or empty string for missing columns
        values = []
        for col in columns:
            value = row_data.get(col, "")
            values.append(str(value) if value is not None else "")
        
        # Insert row
        placeholders = ", ".join(["?" for _ in columns])
        column_names = ", ".join([f'"{col}"' for col in columns])
        
        cursor.execute(f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})', values)
        conn.commit()
        
        new_row_id = cursor.lastrowid
        conn.close()
        
        return {
            "status": "success", 
            "message": "Row added successfully",
            "row_id": new_row_id,
            "table_name": table_name,
            "data_inserted": dict(zip(columns, values))
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/tables/{table_name}/rows/{row_id}")
async def update_table_row(project: str, table_name: str, row_id: int, row_data: dict) -> Dict[str, Any]:
    """Update existing table row by rowid"""
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Check if row exists
        cursor.execute(f'SELECT rowid FROM "{table_name}" WHERE rowid = ?', (row_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Row with ID {row_id} not found")
        
        # Build UPDATE query for provided fields only
        set_clauses = []
        values = []
        for key, value in row_data.items():
            set_clauses.append(f'"{key}" = ?')
            values.append(str(value) if value is not None else "")
        
        if not set_clauses:
            conn.close()
            raise HTTPException(status_code=400, detail="No update data provided")
        
        values.append(row_id)
        query = f'UPDATE "{table_name}" SET {", ".join(set_clauses)} WHERE rowid = ?'
        
        cursor.execute(query, values)
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return {
            "status": "success", 
            "message": f"Row {row_id} updated successfully",
            "rows_affected": rows_affected,
            "updated_fields": list(row_data.keys())
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/tables/{table_name}/rows/{row_id}")
async def delete_table_row(project: str, table_name: str, row_id: int) -> Dict[str, Any]:
    """Delete specific table row by rowid"""
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Check if row exists before deleting
        cursor.execute(f'SELECT rowid FROM "{table_name}" WHERE rowid = ?', (row_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Row with ID {row_id} not found")
        
        # Delete the row
        cursor.execute(f'DELETE FROM "{table_name}" WHERE rowid = ?', (row_id,))
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return {
            "status": "success", 
            "message": f"Row {row_id} deleted successfully",
            "rows_affected": rows_affected
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/tables/{table_name}")
async def delete_table(project: str, table_name: str) -> Dict[str, Any]:
    """Delete entire table"""
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists and get row count
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Get row count before deletion
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        row_count = cursor.fetchone()[0]
        
        # Drop the table
        cursor.execute(f'DROP TABLE "{table_name}"')
        conn.commit()
        conn.close()
        
        return {
            "status": "success", 
            "message": f"Table '{table_name}' deleted successfully",
            "rows_deleted": row_count
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ===================================================================
# UTILITY ENDPOINTS
# ===================================================================

@router.get("/tables/{table_name}/schema")
async def get_table_schema(project: str, table_name: str) -> Dict[str, Any]:
    """Get table schema information"""
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()
        
        # Get row count
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        row_count = cursor.fetchone()[0]
        
        columns = []
        for col_info in columns_info:
            columns.append({
                "name": col_info[1],
                "type": col_info[2],
                "not_null": bool(col_info[3]),
                "default_value": col_info[4],
                "primary_key": bool(col_info[5])
            })
        
        conn.close()
        
        return {
            "table_name": table_name,
            "columns": columns,
            "row_count": row_count,
            "total_columns": len(columns)
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/health")
async def tables_health_check(project: str) -> Dict[str, Any]:
    """Health check for table operations"""
    try:
        db_path = validate_project_exists(project)
        
        # Test database connection
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get database stats
        cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        table_count = cursor.fetchone()[0]
        
        # Test a simple query
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
        test_result = cursor.fetchone()
        
        conn.close()
        
        return {
            "status": "healthy",
            "project": project,
            "database_accessible": True,
            "table_count": table_count,
            "test_query_successful": test_result is not None,
            "enhanced_crud": "available"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "project": project,
            "error": str(e),
            "database_accessible": False
        }
