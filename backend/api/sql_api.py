# backend/api/sql_api.py - COMPLETE PRODUCTION-READY VERSION

import os
import sqlite3
import tempfile
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Form
from typing import List, Dict, Any, Optional
import json
import traceback
from datetime import datetime

router = APIRouter()
PROJECTS_DIR = "projects"

# ===================================================================
# UTILITY FUNCTIONS
# ===================================================================

def get_db_path(project: str) -> str:
    """Get the database path for a project"""
    return os.path.join(PROJECTS_DIR, project, "project.db")

def validate_project_exists(project: str) -> str:
    """Validate project exists and return database path"""
    if not project or not isinstance(project, str):
        raise HTTPException(status_code=400, detail="Project name is required")
    
    project_path = os.path.join(PROJECTS_DIR, project)
    if not os.path.exists(project_path):
        raise HTTPException(status_code=404, detail=f"Project directory '{project}' does not exist")
    
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project database '{project}' does not exist")
    
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
            result = [{"rows_affected": cursor.rowcount}]
        
        conn.close()
        return result
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def clean_column_name(col_name: str) -> str:
    """Clean and validate column names"""
    if not col_name:
        return "unnamed_column"
    
    # Convert to string and clean
    clean_col = str(col_name).strip()
    
    # Replace spaces and hyphens with underscores
    clean_col = clean_col.replace(' ', '_').replace('-', '_')
    
    # Remove any characters that aren't alphanumeric or underscore
    clean_col = ''.join(c for c in clean_col if c.isalnum() or c == '_')
    
    # Ensure it doesn't start with a number
    if clean_col and clean_col[0].isdigit():
        clean_col = f"col_{clean_col}"
    
    # Fallback if empty
    if not clean_col:
        clean_col = "unnamed_column"
    
    return clean_col

# ===================================================================
# TABLE LISTING AND BASIC OPERATIONS
# ===================================================================

@router.get("/list")
async def list_tables(project: str = Query(...)) -> Dict[str, List[str]]:
    """List all tables in project database"""
    print(f"[SQL API] Listing tables for project: {project}")
    
    db_path = validate_project_exists(project)
    
    try:
        result = execute_query_safely(
            db_path, 
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        table_names = [row['name'] for row in result]
        
        print(f"[SQL API] Found {len(table_names)} tables: {table_names}")
        return {"tables": table_names}
    except Exception as e:
        print(f"[SQL API ERROR] Failed to list tables: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables/{table_name}")
async def get_table_data(project: str = Query(...), table_name: str = None) -> Dict[str, Any]:
    """Get all data from a specific table"""
    print(f"[SQL API] Getting data from table '{table_name}' in project '{project}'")
    
    db_path = validate_project_exists(project)
    
    if not table_name:
        raise HTTPException(status_code=400, detail="Table name is required")
    
    try:
        # Check if table exists
        table_check = execute_query_safely(
            db_path,
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,)
        )
        
        if not table_check:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        
        # Get table data with rowid
        data = execute_query_safely(db_path, f'SELECT rowid, * FROM "{table_name}"')
        
        print(f"[SQL API] Retrieved {len(data)} rows from table '{table_name}'")
        
        return {
            "table_name": table_name,
            "data": data,
            "row_count": len(data)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SQL API ERROR] Failed to get table data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables/{table_name}/schema")
async def get_table_schema(project: str = Query(...), table_name: str = None) -> Dict[str, Any]:
    """Get table schema information"""
    print(f"[SQL API] Getting schema for table '{table_name}' in project '{project}'")
    
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

# ===================================================================
# CSV UPLOAD - BULLETPROOF VERSION
# ===================================================================

@router.post("/upload_csv")
async def upload_csv(
    file: UploadFile = File(...),
    project: str = Query(..., description="Project name"),
    table_name: str = Query(..., description="Table name for the CSV data")
) -> Dict[str, Any]:
    """Upload CSV file to create and populate table - BULLETPROOF VERSION"""
    
    print(f"[CSV UPLOAD] Starting upload:")
    print(f"  Project: {project}")
    print(f"  Table: {table_name}")
    print(f"  File: {file.filename}")
    print(f"  Content Type: {file.content_type}")
    
    # Input validation
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a filename")
    
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV (.csv extension required)")
    
    if not project or not project.strip():
        raise HTTPException(status_code=400, detail="Project parameter is required")
    
    if not table_name or not table_name.strip():
        raise HTTPException(status_code=400, detail="Table name parameter is required")
    
    # Validate table name
    clean_table_name = clean_column_name(table_name)
    if not clean_table_name or not clean_table_name.replace('_', '').isalnum():
        raise HTTPException(status_code=400, detail="Table name must be alphanumeric (underscores allowed)")
    
    # Validate project exists
    db_path = validate_project_exists(project)
    
    tmp_path = None
    try:
        # Read file content
        print(f"[CSV UPLOAD] Reading file content...")
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        print(f"[CSV UPLOAD] File size: {len(content)} bytes")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.csv', delete=False) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        print(f"[CSV UPLOAD] Temporary file created: {tmp_path}")
        
        # Parse CSV with pandas - try multiple encodings
        df = None
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings_to_try:
            try:
                print(f"[CSV UPLOAD] Trying encoding: {encoding}")
                df = pd.read_csv(tmp_path, encoding=encoding)
                print(f"[CSV UPLOAD] Successfully parsed with {encoding}")
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"[CSV UPLOAD] Error with {encoding}: {str(e)}")
                continue
        
        if df is None:
            raise HTTPException(status_code=400, detail="Could not parse CSV file - unsupported encoding")
        
        # Validate CSV has data
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file contains no data rows")
        
        print(f"[CSV UPLOAD] Parsed CSV:")
        print(f"  Rows: {len(df)}")
        print(f"  Original columns: {list(df.columns)}")
        
        # Clean column names
        original_columns = df.columns.tolist()
        cleaned_columns = []
        
        for i, col in enumerate(original_columns):
            clean_col = clean_column_name(col)
            
            # Ensure uniqueness
            base_col = clean_col
            counter = 1
            while clean_col in cleaned_columns:
                clean_col = f"{base_col}_{counter}"
                counter += 1
            
            cleaned_columns.append(clean_col)
        
        # Update dataframe columns
        df.columns = cleaned_columns
        print(f"[CSV UPLOAD] Cleaned columns: {cleaned_columns}")
        
        # Database operations
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            print(f"[CSV UPLOAD] Creating/updating table '{clean_table_name}'...")
            
            # Drop table if exists (overwrite mode)
            cursor.execute(f'DROP TABLE IF EXISTS "{clean_table_name}"')
            
            # Create table with all TEXT columns for simplicity
            column_defs = ", ".join([f'"{col}" TEXT' for col in cleaned_columns])
            create_sql = f'CREATE TABLE "{clean_table_name}" ({column_defs})'
            cursor.execute(create_sql)
            
            print(f"[CSV UPLOAD] Table created: {create_sql}")
            
            # Insert data row by row
            rows_inserted = 0
            column_names = ", ".join([f'"{col}"' for col in cleaned_columns])
            placeholders = ", ".join(["?" for _ in cleaned_columns])
            insert_sql = f'INSERT INTO "{clean_table_name}" ({column_names}) VALUES ({placeholders})'
            
            for index, row in df.iterrows():
                values = []
                for col in cleaned_columns:
                    value = row[col]
                    
                    # Handle NaN and None values
                    if pd.isna(value) or value is None:
                        values.append("")
                    else:
                        # Convert to string, handling various data types
                        try:
                            values.append(str(value).strip())
                        except:
                            values.append("")
                
                cursor.execute(insert_sql, values)
                rows_inserted += 1
                
                # Progress logging for large files
                if rows_inserted % 1000 == 0:
                    print(f"[CSV UPLOAD] Inserted {rows_inserted} rows...")
            
            conn.commit()
            print(f"[CSV UPLOAD] Successfully inserted {rows_inserted} rows")
            
            # Verify final count
            cursor.execute(f'SELECT COUNT(*) FROM "{clean_table_name}"')
            final_count = cursor.fetchone()[0]
            
            success_response = {
                "status": "success",
                "message": f"CSV uploaded successfully to table '{clean_table_name}'",
                "table_name": clean_table_name,
                "original_filename": file.filename,
                "original_columns": original_columns,
                "cleaned_columns": cleaned_columns,
                "rows_inserted": rows_inserted,
                "final_row_count": final_count,
                "upload_timestamp": datetime.now().isoformat()
            }
            
            print(f"[CSV UPLOAD] Upload completed successfully:")
            print(f"  Table: {clean_table_name}")
            print(f"  Rows: {final_count}")
            
            return success_response
            
        except sqlite3.Error as e:
            conn.rollback()
            error_msg = f"Database error during CSV upload: {str(e)}"
            print(f"[CSV UPLOAD ERROR] {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        finally:
            conn.close()
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except Exception as e:
        error_msg = f"Unexpected error during CSV upload: {str(e)}"
        print(f"[CSV UPLOAD ERROR] {error_msg}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        # Cleanup temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                print(f"[CSV UPLOAD] Cleaned up temporary file: {tmp_path}")
            except Exception as e:
                print(f"[CSV UPLOAD WARNING] Could not delete temp file: {e}")

# ===================================================================
# TABLE CREATION AND MANAGEMENT
# ===================================================================

@router.post("/create")
async def create_empty_table(project: str = Query(...), table_data: dict = None) -> Dict[str, Any]:
    """Create a new empty table with specified columns"""
    print(f"[SQL API] Creating table in project: {project}")
    print(f"[SQL API] Table data: {table_data}")
    
    if not table_data:
        raise HTTPException(status_code=400, detail="Table configuration is required")
    
    table_name = table_data.get("name")
    columns = table_data.get("columns", [])
    
    if not table_name:
        raise HTTPException(status_code=400, detail="Table name is required")
    
    if not columns:
        raise HTTPException(status_code=400, detail="At least one column is required")
    
    # Clean table name
    clean_table_name = clean_column_name(table_name)
    
    # Clean and validate column names
    cleaned_columns = []
    for col in columns:
        clean_col = clean_column_name(col)
        if clean_col and clean_col not in cleaned_columns:
            cleaned_columns.append(clean_col)
    
    if not cleaned_columns:
        raise HTTPException(status_code=400, detail="At least one valid column name required")
    
    db_path = validate_project_exists(project)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (clean_table_name,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"Table '{clean_table_name}' already exists")
        
        # Create table with cleaned column names (all TEXT for simplicity)
        column_defs = ", ".join([f'"{col}" TEXT' for col in cleaned_columns])
        create_sql = f'CREATE TABLE "{clean_table_name}" ({column_defs})'
        cursor.execute(create_sql)
        
        conn.commit()
        conn.close()
        
        print(f"[SQL API] Successfully created table: {clean_table_name}")
        
        return {
            "status": "success", 
            "message": f"Table '{clean_table_name}' created successfully",
            "table_name": clean_table_name, 
            "columns": cleaned_columns,
            "column_count": len(cleaned_columns)
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ===================================================================
# ROW OPERATIONS
# ===================================================================

@router.post("/tables/{table_name}/rows")
async def add_table_row(project: str = Query(...), table_name: str = None, row_data: dict = None) -> Dict[str, Any]:
    """Add a new row to existing table"""
    print(f"[SQL API] Adding row to table '{table_name}' in project '{project}'")
    
    if not row_data:
        raise HTTPException(status_code=400, detail="Row data is required")
    
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
        
        # Prepare insert values
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
        
        print(f"[SQL API] Successfully added row with ID: {new_row_id}")
        
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
async def update_table_row(project: str = Query(...), table_name: str = None, row_id: int = None, row_data: dict = None) -> Dict[str, Any]:
    """Update existing table row by rowid"""
    print(f"[SQL API] Updating row {row_id} in table '{table_name}'")
    
    if not row_data:
        raise HTTPException(status_code=400, detail="Row data is required")
    
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
        
        # Build UPDATE query
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
        
        print(f"[SQL API] Successfully updated row {row_id}")
        
        return {
            "status": "success", 
            "message": f"Row {row_id} updated successfully",
            "rows_affected": rows_affected,
            "updated_fields": list(row_data.keys())
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/tables/{table_name}/rows/{row_id}")
async def delete_table_row(project: str = Query(...), table_name: str = None, row_id: int = None) -> Dict[str, Any]:
    """Delete specific table row by rowid"""
    print(f"[SQL API] Deleting row {row_id} from table '{table_name}'")
    
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
        
        # Delete the row
        cursor.execute(f'DELETE FROM "{table_name}" WHERE rowid = ?', (row_id,))
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        print(f"[SQL API] Successfully deleted row {row_id}")
        
        return {
            "status": "success", 
            "message": f"Row {row_id} deleted successfully",
            "rows_affected": rows_affected
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/tables/{table_name}")
async def delete_table(project: str = Query(...), table_name: str = None) -> Dict[str, Any]:
    """Delete entire table"""
    print(f"[SQL API] Deleting table '{table_name}' from project '{project}'")
    
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
        
        print(f"[SQL API] Successfully deleted table '{table_name}' with {row_count} rows")
        
        return {
            "status": "success", 
            "message": f"Table '{table_name}' deleted successfully",
            "rows_deleted": row_count
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ===================================================================
# HEALTH CHECK
# ===================================================================

@router.get("/health")
async def tables_health_check(project: str = Query(...)) -> Dict[str, Any]:
    """Health check for table operations"""
    print(f"[SQL API] Health check for project: {project}")
    
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
            "enhanced_crud": "available",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "project": project,
            "error": str(e),
            "database_accessible": False,
            "timestamp": datetime.now().isoformat()
        }

# ===================================================================
# FRONTEND-COMPATIBLE ROUTING FIX
# ===================================================================

@router.post("/tables/upload_csv")
async def upload_csv_frontend_compatible(
    file: UploadFile = File(...),
    project: str = Query(..., description="Project name"),
    table_name: str = Query(..., description="Table name for the CSV data")
) -> Dict[str, Any]:
    """
    Frontend-compatible CSV upload endpoint
    Matches the exact URL pattern your React app is calling:
    /projects/{project}/tables/tables/upload_csv
    """
    print(f"[CSV UPLOAD] Frontend-compatible route called")
    print(f"  Project: {project}")
    print(f"  Table: {table_name}")
    print(f"  File: {file.filename}")
    
    # Call the existing bulletproof upload function
    return await upload_csv(file=file, project=project, table_name=table_name)


# ===================================================================
# FRONTEND-COMPATIBLE ROUTING FIX
# ===================================================================

@router.post("/tables/upload_csv")
async def upload_csv_frontend_compatible(
    file: UploadFile = File(...),
    project: str = Query(..., description="Project name"),
    table_name: str = Query(..., description="Table name for the CSV data")
) -> Dict[str, Any]:
    """
    Frontend-compatible CSV upload endpoint
    Matches the exact URL pattern your React app is calling:
    /projects/{project}/tables/tables/upload_csv
    """
    print(f"[CSV UPLOAD] Frontend-compatible route called")
    print(f"  Project: {project}")
    print(f"  Table: {table_name}")
    print(f"  File: {file.filename}")
    
    # Call the existing bulletproof upload function
    return await upload_csv(file=file, project=project, table_name=table_name)

