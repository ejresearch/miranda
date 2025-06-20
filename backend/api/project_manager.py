# backend/api/project_manager.py - COMPLETE REWRITE WITH AUTO-REPAIR

import os
import sqlite3
import json
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException

# Initialize projects directory
PROJECTS_DIR = os.path.join(os.path.dirname(__file__), "../../projects")
os.makedirs(PROJECTS_DIR, exist_ok=True)

router = APIRouter()

# ===================================================================
# UTILITY ENDPOINTS
# ===================================================================

@router.get("/projects/{name}/health")
async def get_project_health(name: str) -> Dict[str, Any]:
    """Comprehensive project health check"""
    sanitized_name = validate_project_name(name)
    project_path = get_project_path(sanitized_name)
    
    if not os.path.isdir(project_path):
        raise HTTPException(status_code=404, detail="Project not found")
    
    health_report = {
        "project_name": sanitized_name,
        "overall_status": "healthy",
        "checks": {},
        "issues": [],
        "recommendations": []
    }
    
    try:
        # Check 1: Project directory
        health_report["checks"]["project_directory"] = {
            "status": "pass",
            "message": "Project directory exists"
        }
        
        # Check 2: Database file
        db_path = os.path.join(project_path, "project.db")
        if os.path.exists(db_path):
            try:
                # Test database connection
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
                cursor.fetchone()
                conn.close()
                
                health_report["checks"]["database"] = {
                    "status": "pass",
                    "message": "Database accessible",
                    "size_bytes": os.path.getsize(db_path)
                }
            except sqlite3.Error as e:
                health_report["checks"]["database"] = {
                    "status": "fail",
                    "message": f"Database corrupted: {str(e)}"
                }
                health_report["issues"].append("Database corruption detected")
                health_report["overall_status"] = "unhealthy"
        else:
            health_report["checks"]["database"] = {
                "status": "fail",
                "message": "Database file missing"
            }
            health_report["issues"].append("Missing database file")
            health_report["recommendations"].append("Run project repair to create database")
        
        # Check 3: LightRAG directory
        lightrag_path = os.path.join(project_path, "lightrag")
        if os.path.exists(lightrag_path):
            bucket_count = len([d for d in os.listdir(lightrag_path) if os.path.isdir(os.path.join(lightrag_path, d))])
            health_report["checks"]["lightrag"] = {
                "status": "pass",
                "message": f"LightRAG directory exists with {bucket_count} buckets"
            }
        else:
            health_report["checks"]["lightrag"] = {
                "status": "warning",
                "message": "LightRAG directory missing"
            }
            health_report["recommendations"].append("Create LightRAG directory for document processing")
        
        # Check 4: Metadata file
        metadata_path = os.path.join(project_path, "metadata.json")
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                health_report["checks"]["metadata"] = {
                    "status": "pass",
                    "message": "Metadata file valid"
                }
            except json.JSONDecodeError:
                health_report["checks"]["metadata"] = {
                    "status": "warning",
                    "message": "Metadata file corrupted"
                }
                health_report["recommendations"].append("Repair metadata file")
        else:
            health_report["checks"]["metadata"] = {
                "status": "warning",
                "message": "Metadata file missing"
            }
            health_report["recommendations"].append("Create metadata file")
        
        # Overall assessment
        failed_checks = [check for check in health_report["checks"].values() if check["status"] == "fail"]
        if failed_checks:
            health_report["overall_status"] = "unhealthy"
        elif any(check["status"] == "warning" for check in health_report["checks"].values()):
            health_report["overall_status"] = "needs_attention"
        
        return health_report
        
    except Exception as e:
        return {
            "project_name": sanitized_name,
            "overall_status": "error",
            "error": str(e),
            "checks": health_report["checks"],
            "issues": health_report["issues"] + [f"Health check failed: {str(e)}"]
        }

@router.post("/projects/{name}/repair")
async def repair_project(name: str) -> Dict[str, Any]:
    """Repair project structure and fix common issues"""
    sanitized_name = validate_project_name(name)
    project_path = get_project_path(sanitized_name)
    
    if not os.path.isdir(project_path):
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        print(f"[PROJECT] Starting repair for project: {sanitized_name}")
        
        # Run structure repair
        repair_result = ensure_project_structure(project_path, sanitized_name)
        
        # Additional repairs
        additional_repairs = []
        
        # Repair 1: Fix corrupted metadata
        metadata_path = os.path.join(project_path, "metadata.json")
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    json.load(f)  # Test if valid JSON
            except json.JSONDecodeError:
                print(f"[PROJECT] Repairing corrupted metadata for: {sanitized_name}")
                backup_path = metadata_path + ".corrupted.bak"
                shutil.move(metadata_path, backup_path)
                
                # Create new metadata
                new_metadata = {
                    "name": sanitized_name,
                    "created": datetime.now().isoformat(),
                    "type": "custom",
                    "template": "unknown",
                    "buckets": [],
                    "tables": [],
                    "repaired": True,
                    "corrupted_backup": backup_path
                }
                
                with open(metadata_path, 'w') as f:
                    json.dump(new_metadata, f, indent=2)
                
                additional_repairs.append("metadata_corruption_fixed")
        
        # Repair 2: Database integrity check
        db_path = os.path.join(project_path, "project.db")
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Check if versions table exists and has correct structure
                cursor.execute("PRAGMA table_info(versions)")
                version_columns = cursor.fetchall()
                
                expected_columns = ['id', 'project_id', 'type', 'name', 'focus', 'created', 'prompt', 'result', 'metadata_json']
                existing_columns = [col[1] for col in version_columns]
                
                if not all(col in existing_columns for col in expected_columns):
                    print(f"[PROJECT] Recreating versions table for: {sanitized_name}")
                    cursor.execute("DROP TABLE IF EXISTS versions")
                    cursor.execute("""
                        CREATE TABLE versions (
                            id TEXT PRIMARY KEY,
                            project_id TEXT NOT NULL,
                            type TEXT NOT NULL,
                            name TEXT NOT NULL,
                            focus TEXT,
                            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            prompt TEXT NOT NULL,
                            result TEXT NOT NULL,
                            metadata_json TEXT
                        );
                    """)
                    additional_repairs.append("versions_table_recreated")
                
                conn.commit()
                conn.close()
                
            except sqlite3.Error as e:
                print(f"[PROJECT] Database repair failed for {sanitized_name}: {str(e)}")
                additional_repairs.append(f"database_repair_failed: {str(e)}")
        
        # Get final project stats
        final_stats = get_project_stats(project_path)
        
        print(f"[PROJECT] Repair completed for: {sanitized_name}")
        
        return {
            "status": "repaired",
            "project": sanitized_name,
            "structure_repairs": repair_result,
            "additional_repairs": additional_repairs,
            "final_stats": final_stats
        }
        
    except Exception as e:
        print(f"[ERROR] Repair failed for project '{sanitized_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Repair failed: {str(e)}")

@router.get("/projects/{name}/stats")
async def get_project_detailed_stats(name: str) -> Dict[str, Any]:
    """Get detailed project statistics"""
    sanitized_name = validate_project_name(name)
    project_path = get_project_path(sanitized_name)
    
    if not os.path.isdir(project_path):
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        stats = get_project_stats(project_path)
        
        # Get additional detailed stats
        db_path = os.path.join(project_path, "project.db")
        detailed_stats = {
            "basic": stats,
            "tables": {},
            "versions": {},
            "storage": {}
        }
        
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Table details
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                tables = cursor.fetchall()
                
                for (table_name,) in tables:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                    row_count = cursor.fetchone()[0]
                    detailed_stats["tables"][table_name] = {"row_count": row_count}
                
                # Version details
                cursor.execute("SELECT type, COUNT(*) FROM versions GROUP BY type")
                version_counts = cursor.fetchall()
                for version_type, count in version_counts:
                    detailed_stats["versions"][version_type] = count
                
                # Recent activity
                cursor.execute("SELECT type, MAX(created) FROM versions GROUP BY type")
                recent_activity = cursor.fetchall()
                detailed_stats["recent_activity"] = dict(recent_activity)
                
                conn.close()
                
            except sqlite3.Error as e:
                detailed_stats["database_error"] = str(e)
        
        # Storage details
        total_size = 0
        for root, dirs, files in os.walk(project_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    total_size += os.path.getsize(file_path)
                except OSError:
                    pass
        
        detailed_stats["storage"]["total_size_bytes"] = total_size
        detailed_stats["storage"]["total_size_mb"] = round(total_size / (1024 * 1024), 2)
        
        return detailed_stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

# ===================================================================
# HEALTH AND MONITORING
# ===================================================================

@router.get("/system/health")
async def system_health_check() -> Dict[str, Any]:
    """Overall system health check"""
    try:
        # Check projects directory
        projects_accessible = os.path.exists(PROJECTS_DIR) and os.access(PROJECTS_DIR, os.W_OK)
        
        # Count projects
        project_count = 0
        healthy_projects = 0
        
        if projects_accessible:
            try:
                for item in os.listdir(PROJECTS_DIR):
                    item_path = os.path.join(PROJECTS_DIR, item)
                    if os.path.isdir(item_path):
                        project_count += 1
                        
                        # Quick health check
                        db_path = os.path.join(item_path, "project.db")
                        if os.path.exists(db_path):
                            try:
                                conn = sqlite3.connect(db_path)
                                conn.close()
                                healthy_projects += 1
                            except:
                                pass
            except OSError:
                pass
        
        return {
            "status": "healthy" if projects_accessible else "unhealthy",
            "projects_directory_accessible": projects_accessible,
            "total_projects": project_count,
            "healthy_projects": healthy_projects,
            "unhealthy_projects": project_count - healthy_projects,
            "projects_directory": PROJECTS_DIR
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "projects_directory": PROJECTS_DIR
        }
# UTILITY FUNCTIONS
# ===================================================================

def get_project_path(name: str) -> str:
    """Get the full path to a project directory"""
    return os.path.join(PROJECTS_DIR, name)

def validate_project_name(name: str) -> str:
    """Validate and sanitize project name"""
    if not name or not isinstance(name, str):
        raise HTTPException(status_code=400, detail="Project name must be a non-empty string")
    
    # Remove dangerous characters
    sanitized = "".join(c for c in name if c.isalnum() or c in "._-")
    
    if not sanitized:
        raise HTTPException(status_code=400, detail="Project name must contain alphanumeric characters")
    
    if len(sanitized) > 100:
        raise HTTPException(status_code=400, detail="Project name must be 100 characters or less")
    
    return sanitized

def ensure_project_structure(project_path: str, project_name: str) -> Dict[str, Any]:
    """Ensure all required project directories and files exist"""
    created_items = []
    repaired_items = []
    
    try:
        # Create main project directory
        if not os.path.exists(project_path):
            os.makedirs(project_path, exist_ok=True)
            created_items.append("project_directory")
        
        # Ensure database exists
        db_path = os.path.join(project_path, "project.db")
        if not os.path.exists(db_path):
            print(f"[PROJECT] Creating database for project '{project_name}'")
            conn = sqlite3.connect(db_path)
            
            # Create essential tables
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
                    metadata_json TEXT
                );
            """)
            
            # Create project_info table for metadata
            conn.execute("""
                CREATE TABLE IF NOT EXISTS project_info (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Insert basic project info
            conn.execute(
                "INSERT OR REPLACE INTO project_info (key, value) VALUES (?, ?)",
                ("project_name", project_name)
            )
            conn.execute(
                "INSERT OR REPLACE INTO project_info (key, value) VALUES (?, ?)",
                ("created", datetime.now().isoformat())
            )
            
            conn.commit()
            conn.close()
            created_items.append("database")
        
        # Ensure LightRAG directory exists
        lightrag_path = os.path.join(project_path, "lightrag")
        if not os.path.exists(lightrag_path):
            os.makedirs(lightrag_path, exist_ok=True)
            created_items.append("lightrag_directory")
        
        # Ensure metadata.json exists
        metadata_path = os.path.join(project_path, "metadata.json")
        if not os.path.exists(metadata_path):
            print(f"[PROJECT] Creating metadata for project '{project_name}'")
            
            # Get existing table count from database
            table_count = 0
            bucket_count = 0
            
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                table_count = cursor.fetchone()[0]
                conn.close()
            except:
                pass
            
            try:
                bucket_count = len([d for d in os.listdir(lightrag_path) if os.path.isdir(os.path.join(lightrag_path, d))])
            except:
                pass
            
            metadata = {
                "name": project_name,
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat(),
                "type": "custom",
                "template": "unknown",
                "buckets": [],
                "tables": [],
                "stats": {
                    "table_count": table_count,
                    "bucket_count": bucket_count
                },
                "auto_created": True,
                "version": "1.0"
            }
            
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            created_items.append("metadata")
        
        return {
            "status": "success",
            "created_items": created_items,
            "repaired_items": repaired_items
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to ensure project structure for '{project_name}': {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "created_items": created_items,
            "repaired_items": repaired_items
        }

def get_project_stats(project_path: str) -> Dict[str, Any]:
    """Get comprehensive project statistics"""
    stats = {
        "table_count": 0,
        "bucket_count": 0,
        "version_count": 0,
        "database_size": 0,
        "last_activity": None,
        "health_status": "unknown"
    }
    
    try:
        # Database stats
        db_path = os.path.join(project_path, "project.db")
        if os.path.exists(db_path):
            stats["database_size"] = os.path.getsize(db_path)
            
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Count tables
                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                stats["table_count"] = cursor.fetchone()[0]
                
                # Count versions
                cursor.execute("SELECT COUNT(*) FROM versions")
                stats["version_count"] = cursor.fetchone()[0]
                
                # Get last activity
                cursor.execute("SELECT MAX(created) FROM versions")
                last_activity = cursor.fetchone()[0]
                if last_activity:
                    stats["last_activity"] = last_activity
                
                conn.close()
                stats["health_status"] = "healthy"
                
            except sqlite3.Error as e:
                print(f"[WARNING] Database error getting stats: {str(e)}")
                stats["health_status"] = "database_error"
        
        # Bucket stats
        lightrag_path = os.path.join(project_path, "lightrag")
        if os.path.exists(lightrag_path):
            try:
                buckets = [d for d in os.listdir(lightrag_path) if os.path.isdir(os.path.join(lightrag_path, d))]
                stats["bucket_count"] = len(buckets)
            except OSError:
                stats["bucket_count"] = 0
        
        if stats["health_status"] == "unknown":
            stats["health_status"] = "healthy"
            
    except Exception as e:
        print(f"[ERROR] Failed to get project stats: {str(e)}")
        stats["health_status"] = "error"
    
    return stats

# ===================================================================
# API ENDPOINTS
# ===================================================================

@router.get("/projects")
async def api_list_projects() -> Dict[str, Any]:
    """List all projects with enhanced information"""
    try:
        if not os.path.exists(PROJECTS_DIR):
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            return {"projects": [], "total_count": 0}
        
        project_list = []
        project_names = []
        
        for item in os.listdir(PROJECTS_DIR):
            item_path = os.path.join(PROJECTS_DIR, item)
            
            if os.path.isdir(item_path):
                try:
                    # Get basic project info
                    project_info = {
                        "name": item,
                        "path": item_path
                    }
                    
                    # Get metadata if available
                    metadata_path = os.path.join(item_path, "metadata.json")
                    if os.path.exists(metadata_path):
                        try:
                            with open(metadata_path, 'r') as f:
                                metadata = json.load(f)
                                project_info.update({
                                    "template": metadata.get("template", "unknown"),
                                    "created": metadata.get("created"),
                                    "description": metadata.get("description", "")
                                })
                        except json.JSONDecodeError:
                            print(f"[WARNING] Invalid metadata JSON for project: {item}")
                    
                    # Get project stats
                    stats = get_project_stats(item_path)
                    project_info["stats"] = stats
                    
                    project_list.append(project_info)
                    project_names.append(item)
                    
                except Exception as e:
                    print(f"[WARNING] Error processing project '{item}': {str(e)}")
                    # Still include the project name even if we can't get details
                    project_names.append(item)
        
        # Sort by name
        project_list.sort(key=lambda x: x["name"])
        project_names.sort()
        
        return {
            "projects": project_names,  # Keep backward compatibility
            "detailed_projects": project_list,
            "total_count": len(project_names)
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to list projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(e)}")

@router.post("/projects/new")
async def create_project(body: dict) -> Dict[str, Any]:
    """Create a new project with enhanced validation and structure"""
    name = body.get("name")
    description = body.get("description", "")
    
    if not name:
        raise HTTPException(status_code=400, detail="Project name required")
    
    # Validate and sanitize name
    sanitized_name = validate_project_name(name)
    project_path = get_project_path(sanitized_name)
    
    # Check if project already exists
    if os.path.exists(project_path):
        raise HTTPException(status_code=400, detail=f"Project '{sanitized_name}' already exists")
    
    try:
        # Create project structure
        structure_result = ensure_project_structure(project_path, sanitized_name)
        
        if structure_result["status"] == "error":
            # Cleanup on failure
            if os.path.exists(project_path):
                shutil.rmtree(project_path)
            raise HTTPException(status_code=500, detail=f"Failed to create project structure: {structure_result['error']}")
        
        # Update metadata with description
        if description:
            metadata_path = os.path.join(project_path, "metadata.json")
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                metadata["description"] = description
                metadata["updated"] = datetime.now().isoformat()
                
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
            except Exception as e:
                print(f"[WARNING] Failed to update metadata with description: {str(e)}")
        
        print(f"[PROJECT] Successfully created project: {sanitized_name}")
        
        return {
            "status": "created",
            "project": sanitized_name,
            "original_name": name,
            "description": description,
            "structure": structure_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on failure
        if os.path.exists(project_path):
            try:
                shutil.rmtree(project_path)
            except:
                pass
        
        print(f"[ERROR] Failed to create project '{sanitized_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.get("/projects/{name}")
async def get_project(name: str) -> Dict[str, Any]:
    """Get project details with auto-repair functionality"""
    # Validate project name
    sanitized_name = validate_project_name(name)
    project_path = get_project_path(sanitized_name)
    
    if not os.path.isdir(project_path):
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Auto-repair project structure
        print(f"[PROJECT] Checking and repairing project structure: {sanitized_name}")
        repair_result = ensure_project_structure(project_path, sanitized_name)
        
        # Get project paths
        db_path = os.path.join(project_path, "project.db")
        lightrag_path = os.path.join(project_path, "lightrag")
        metadata_path = os.path.join(project_path, "metadata.json")
        
        # Load metadata
        metadata = {}
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            except json.JSONDecodeError as e:
                print(f"[WARNING] Invalid metadata JSON for project '{sanitized_name}': {str(e)}")
                # Create new metadata
                metadata = {
                    "name": sanitized_name,
                    "created": "unknown",
                    "type": "custom",
                    "corrupted_metadata_repaired": True
                }
        
        # Get comprehensive stats
        stats = get_project_stats(project_path)
        
        # Get bucket contents
        rag_contents = []
        if os.path.exists(lightrag_path):
            try:
                rag_contents = [d for d in os.listdir(lightrag_path) if os.path.isdir(os.path.join(lightrag_path, d))]
            except OSError:
                rag_contents = []
        
        # Get table names from database
        table_names = []
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                table_names = [row[0] for row in cursor.fetchall()]
                conn.close()
            except sqlite3.Error as e:
                print(f"[WARNING] Database error getting table names: {str(e)}")
        
        response = {
            "name": sanitized_name,
            "original_name": name,
            "sql_exists": os.path.exists(db_path),
            "rag_contents": rag_contents,
            "metadata_exists": os.path.exists(metadata_path),
            "metadata": metadata,
            "stats": stats,
            "tables": table_names,
            "buckets": rag_contents,
            "repair_info": repair_result,
            "status": stats["health_status"]
        }
        
        # Log repair actions
        if repair_result["created_items"] or repair_result["repaired_items"]:
            print(f"[PROJECT] Auto-repair completed for '{sanitized_name}':")
            if repair_result["created_items"]:
                print(f"[PROJECT] Created: {', '.join(repair_result['created_items'])}")
            if repair_result["repaired_items"]:
                print(f"[PROJECT] Repaired: {', '.join(repair_result['repaired_items'])}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error getting project '{sanitized_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving project: {str(e)}")

@router.delete("/projects/{name}")
async def delete_project(name: str) -> Dict[str, Any]:
    """Delete a project with safety checks"""
    sanitized_name = validate_project_name(name)
    project_path = get_project_path(sanitized_name)
    
    if not os.path.isdir(project_path):
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Get project stats before deletion for logging
        stats = get_project_stats(project_path)
        
        # Remove project directory
        shutil.rmtree(project_path)
        
        print(f"[PROJECT] Deleted project '{sanitized_name}' (had {stats['table_count']} tables, {stats['bucket_count']} buckets)")
        
        return {
            "status": "deleted",
            "project": sanitized_name,
            "original_name": name,
            "deleted_stats": stats
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to delete project '{sanitized_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

# ===================================================================
