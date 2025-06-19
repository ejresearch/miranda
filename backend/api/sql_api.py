# Additional endpoints to add to backend/api/sql_api.py

@router.post("/tables/create")
async def create_empty_table(project: str, table_data: dict):
    """Create a new empty table with specified columns"""
    table_name = table_data.get("name")
    columns = table_data.get("columns", [])
    
    if not table_name or not columns:
        raise HTTPException(status_code=400, detail="Table name and columns required")
    
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if table already exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Table '{table_name}' already exists")
        
        # Create column definitions (all TEXT for simplicity)
        column_defs = ", ".join([f'"{col}" TEXT' for col in columns])
        cur.execute(f'CREATE TABLE IF NOT EXISTS "{table_name}" ({column_defs})')
        
        conn.commit()
        return {
            "status": "success", 
            "message": f"Table '{table_name}' created successfully",
            "table": table_name, 
            "columns": columns
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/tables/{table_name}/rows")
async def add_table_row(project: str, table_name: str, row_data: dict):
    """Add a new row to existing table"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Get table columns
        cur.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cur.fetchall()]
        
        if not columns:
            raise HTTPException(status_code=400, detail=f"Table '{table_name}' has no columns")
        
        # Prepare insert values - use provided data or empty string for missing columns
        values = [row_data.get(col, "") for col in columns]
        placeholders = ", ".join(["?" for _ in columns])
        column_names = ", ".join([f'"{col}"' for col in columns])
        
        cur.execute(f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})', values)
        conn.commit()
        
        # Get the rowid of the inserted row
        new_row_id = cur.lastrowid
        
        return {
            "status": "success", 
            "message": "Row added successfully",
            "row_id": new_row_id,
            "table": table_name
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/tables/{table_name}/rows/{row_id}")
async def update_table_row(project: str, table_name: str, row_id: int, row_data: dict):
    """Update existing table row by rowid"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Check if row exists
        cur.execute(f'SELECT rowid FROM "{table_name}" WHERE rowid = ?', (row_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Row with ID {row_id} not found")
        
        # Build UPDATE query
        set_clauses = []
        values = []
        for key, value in row_data.items():
            set_clauses.append(f'"{key}" = ?')
            values.append(value)
        
        if not set_clauses:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        values.append(row_id)
        query = f'UPDATE "{table_name}" SET {", ".join(set_clauses)} WHERE rowid = ?'
        
        cur.execute(query, values)
        conn.commit()
        
        # Check if any rows were actually updated
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="No rows were updated")
        
        return {
            "status": "success", 
            "message": f"Row {row_id} updated successfully",
            "rows_affected": cur.rowcount
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/tables/{table_name}/rows/{row_id}")
async def delete_table_row(project: str, table_name: str, row_id: int):
    """Delete specific table row by rowid"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Check if row exists before deleting
        cur.execute(f'SELECT rowid FROM "{table_name}" WHERE rowid = ?', (row_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Row with ID {row_id} not found")
        
        # Delete the row
        cur.execute(f'DELETE FROM "{table_name}" WHERE rowid = ?', (row_id,))
        conn.commit()
        
        return {
            "status": "success", 
            "message": f"Row {row_id} deleted successfully",
            "rows_affected": cur.rowcount
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/tables/{table_name}")
async def delete_table(project: str, table_name: str):
    """Delete entire table"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Get row count before deletion
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        row_count = cur.fetchone()[0]
        
        # Drop the table
        cur.execute(f'DROP TABLE IF EXISTS "{table_name}"')
        conn.commit()
        
        return {
            "status": "success", 
            "message": f"Table '{table_name}' deleted successfully",
            "rows_deleted": row_count
        }
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/tables/{table_name}/schema")
async def get_table_schema(project: str, table_name: str):
    """Get table schema information"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Get table info
        cur.execute(f"PRAGMA table_info({table_name})")
        columns_info = cur.fetchall()
        
        # Get row count
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        row_count = cur.fetchone()[0]
        
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/tables/{table_name}/rows")
async def get_table_rows_with_ids(project: str, table_name: str, limit: Optional[int] = 100, offset: Optional[int] = 0):
    """Get table rows with rowid for editing purposes"""
    db_path = get_db_path(project)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"Project '{project}' does not exist.")
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist")
        
        # Get rows with rowid for editing
        cur.execute(f'SELECT rowid, * FROM "{table_name}" LIMIT ? OFFSET ?', (limit, offset))
        rows = cur.fetchall()
        
        # Get total count
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        total_count = cur.fetchone()[0]
        
        result_rows = []
        for row in rows:
            row_dict = dict(row)
            result_rows.append(row_dict)
        
        conn.close()
        
        return {
            "table_name": table_name,
            "rows": result_rows,
            "total_rows": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count
        }
        
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
