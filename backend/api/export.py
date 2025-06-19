# backend/api/export.py (NEW)

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
import json
import csv
import io
import os
import sqlite3
import zipfile
import tempfile
from typing import Dict, Any, List
from datetime import datetime

router = APIRouter()

PROJECTS_DIR = "projects"

def get_db_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, project_id, "project.db")

def get_project_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, project_id)

@router.get("/export/json")
async def export_project_json(project_name: str):
    """Export complete project data as downloadable JSON"""
    try:
        # Collect all project data
        project_data = await collect_project_data(project_name)
        
        # Convert to JSON with proper formatting
        json_content = json.dumps(project_data, indent=2, default=str)
        
        # Return as downloadable file
        filename = f"{project_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/csv")
async def export_tables_csv(project_name: str):
    """Export all tables as CSV files in a ZIP bundle"""
    try:
        tables_data = await get_all_tables(project_name)
        
        if not tables_data:
            raise HTTPException(status_code=404, detail="No tables found in project")
        
        # Create a temporary ZIP file
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_zip:
            with zipfile.ZipFile(tmp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                
                for table_name, data in tables_data.items():
                    if data:
                        # Create CSV content for each table
                        output = io.StringIO()
                        if len(data) > 0:
                            fieldnames = data[0].keys()
                            writer = csv.DictWriter(output, fieldnames=fieldnames)
                            writer.writeheader()
                            writer.writerows(data)
                            
                            # Add CSV to ZIP
                            csv_content = output.getvalue()
                            zipf.writestr(f"{table_name}.csv", csv_content)
                
                # Add metadata file
                metadata = await get_project_metadata(project_name)
                zipf.writestr("export_metadata.json", json.dumps(metadata, indent=2, default=str))
            
            # Return ZIP file
            filename = f"{project_name}_tables_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            return FileResponse(
                path=tmp_zip.name,
                filename=filename,
                media_type="application/zip",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/versions/{version_type}")
async def export_versions(project_name: str, version_type: str):
    """Export all versions of a specific type (brainstorm/write) as JSON"""
    try:
        versions = await get_versions_by_type(project_name, version_type)
        
        if not versions:
            raise HTTPException(status_code=404, detail=f"No {version_type} versions found")
        
        export_data = {
            "project_name": project_name,
            "version_type": version_type,
            "export_date": datetime.now().isoformat(),
            "total_versions": len(versions),
            "versions": versions
        }
        
        json_content = json.dumps(export_data, indent=2, default=str)
        filename = f"{project_name}_{version_type}_versions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/complete")
async def export_complete_project(project_name: str):
    """Export everything: tables, versions, metadata, and bucket info as ZIP"""
    try:
        # Create temporary ZIP file
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_zip:
            with zipfile.ZipFile(tmp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                
                # 1. Export all tables as CSV files
                tables_data = await get_all_tables(project_name)
                for table_name, data in tables_data.items():
                    if data and len(data) > 0:
                        output = io.StringIO()
                        fieldnames = data[0].keys()
                        writer = csv.DictWriter(output, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(data)
                        zipf.writestr(f"tables/{table_name}.csv", output.getvalue())
                
                # 2. Export all versions as JSON
                for version_type in ['brainstorm', 'write']:
                    versions = await get_versions_by_type(project_name, version_type)
                    if versions:
                        version_data = {
                            "version_type": version_type,
                            "versions": versions
                        }
                        zipf.writestr(f"versions/{version_type}_versions.json", 
                                    json.dumps(version_data, indent=2, default=str))
                
                # 3. Export project metadata
                metadata = await get_project_metadata(project_name)
                zipf.writestr("project_metadata.json", json.dumps(metadata, indent=2, default=str))
                
                # 4. Export bucket information
                bucket_info = await get_bucket_info(project_name)
                zipf.writestr("bucket_info.json", json.dumps(bucket_info, indent=2, default=str))
                
                # 5. Add README
                readme_content = f"""# {project_name} - Complete Export
                
Generated: {datetime.now().isoformat()}

## Contents:
- tables/ - All database tables exported as CSV files
- versions/ - All brainstorm and write versions as JSON
- project_metadata.json - Project configuration and metadata
- bucket_info.json - Information about document buckets
- README.txt - This file

## Import Instructions:
1. Tables can be imported back using the CSV upload API
2. Versions contain the full prompt and result history
3. Bucket info shows which documents were processed
"""
                zipf.writestr("README.txt", readme_content)
        
        filename = f"{project_name}_complete_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        return FileResponse(
            path=tmp_zip.name,
            filename=filename,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions

async def collect_project_data(project_id: str) -> Dict[str, Any]:
    """Helper to collect all project data for JSON export"""
    metadata = await get_project_metadata(project_id)
    tables = await get_all_tables(project_id)
    brainstorm_versions = await get_versions_by_type(project_id, "brainstorm")
    write_versions = await get_versions_by_type(project_id, "write")
    bucket_info = await get_bucket_info(project_id)
    
    return {
        "project_name": project_id,
        "export_date": datetime.now().isoformat(),
        "metadata": metadata,
        "tables": tables,
        "versions": {
            "brainstorm": brainstorm_versions,
            "write": write_versions
        },
        "buckets": bucket_info,
        "summary": {
            "total_tables": len(tables),
            "total_brainstorms": len(brainstorm_versions),
            "total_writes": len(write_versions),
            "total_buckets": len(bucket_info.get("buckets", []))
        }
    }

async def get_all_tables(project_id: str) -> Dict[str, List[Dict]]:
    """Helper to get all table data"""
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        return {}
    
    tables_data = {}
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        table_names = [row[0] for row in cursor.fetchall()]
        
        # Get data from each table
        for table_name in table_names:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            tables_data[table_name] = [dict(row) for row in rows]
        
        conn.close()
        return tables_data
        
    except Exception as e:
        print(f"Error getting tables: {e}")
        return {}

async def get_versions_by_type(project_id: str, version_type: str) -> List[Dict]:
    """Helper to get all versions of a specific type"""
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, project_id, type, name, focus, created, prompt, result, metadata_json
            FROM versions 
            WHERE project_id = ? AND type = ? 
            ORDER BY created DESC
        """, (project_id, version_type))
        
        versions = []
        for row in cursor.fetchall():
            version_dict = dict(row)
            # Parse metadata JSON
            if version_dict['metadata_json']:
                try:
                    version_dict['metadata'] = json.loads(version_dict['metadata_json'])
                except:
                    version_dict['metadata'] = {}
            del version_dict['metadata_json']
            versions.append(version_dict)
        
        conn.close()
        return versions
        
    except Exception as e:
        print(f"Error getting versions: {e}")
        return []

async def get_project_metadata(project_id: str) -> Dict[str, Any]:
    """Helper to get project metadata"""
    project_path = get_project_path(project_id)
    metadata_path = os.path.join(project_path, "metadata.json")
    
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    else:
        # Return basic metadata if file doesn't exist
        return {
            "name": project_id,
            "created": "unknown",
            "type": "custom"
        }

async def get_bucket_info(project_id: str) -> Dict[str, Any]:
    """Helper to get bucket information"""
    project_path = get_project_path(project_id)
    lightrag_path = os.path.join(project_path, "lightrag")
    
    bucket_info = {
        "buckets": [],
        "total_buckets": 0
    }
    
    if os.path.exists(lightrag_path):
        buckets = [d for d in os.listdir(lightrag_path) if os.path.isdir(os.path.join(lightrag_path, d))]
        bucket_info["buckets"] = buckets
        bucket_info["total_buckets"] = len(buckets)
    
    return bucket_info
