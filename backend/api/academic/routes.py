# backend/api/academic/routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import os
import sqlite3

from .chapter_generator import AcademicChapterGenerator

router = APIRouter()

class ChapterGenerationRequest(BaseModel):
    project_name: str
    chapter_number: int = 1
    academic_level: str = "undergraduate"
    force_regenerate: bool = False

@router.post("/generate-chapter")
async def generate_academic_chapter(request: ChapterGenerationRequest) -> Dict[str, Any]:
    """
    Generate complete academic chapter using section-by-section approach
    Integrates with your existing:
    - backend/core/lightrag_interface.py for LightRAG queries
    - backend/api/writing/logic.py for AI content generation  
    - projects/{name}/project.db structure
    - backend/api/project_versions.py for version tracking
    """
    
    # Validate project exists
    project_path = f"projects/{request.project_name}"
    if not os.path.exists(project_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Project '{request.project_name}' not found"
        )
    
    db_path = f"{project_path}/project.db"
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    try:
        generator = AcademicChapterGenerator(request.project_name)
        result = await generator.generate_complete_chapter(
            chapter_num=request.chapter_number
        )
        
        # Add API-specific metadata
        result["api_metadata"] = {
            "request_params": request.dict(),
            "project_path": project_path,
            "database_path": db_path,
            "endpoint": "/academic/generate-chapter"
        }
        
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Chapter generation failed: {str(e)}"
        )

@router.get("/chapter/{chapter_number}/status")
async def get_chapter_status(project_name: str, chapter_number: int) -> Dict[str, Any]:
    """Get status of chapter generation - check what sections exist"""
    
    project_path = f"projects/{project_name}"
    db_path = f"{project_path}/project.db"
    
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for existing academic sections
        cursor.execute("""
            SELECT section_number, section_title, word_count, generated_timestamp
            FROM academic_sections 
            WHERE chapter_number = ?
            ORDER BY section_number
        """, (chapter_number,))
        
        sections = cursor.fetchall()
        
        # Check for complete chapter
        cursor.execute("""
            SELECT total_sections, total_word_count, generated_timestamp
            FROM academic_chapters 
            WHERE chapter_number = ?
        """, (chapter_number,))
        
        chapter_data = cursor.fetchone()
        conn.close()
        
        # Calculate status
        total_sections_expected = 8  # For Chapter 1
        sections_completed = len(sections)
        
        status = {
            "project_name": project_name,
            "chapter_number": chapter_number,
            "sections_completed": sections_completed,
            "sections_expected": total_sections_expected,
            "completion_percentage": (sections_completed / total_sections_expected) * 100,
            "status": "not_started" if sections_completed == 0 else 
                     "in_progress" if sections_completed < total_sections_expected else 
                     "completed",
            "sections": [
                {
                    "section_number": row[0],
                    "section_title": row[1],
                    "word_count": row[2],
                    "generated_timestamp": row[3]
                } for row in sections
            ],
            "complete_chapter": {
                "exists": chapter_data is not None,
                "total_sections": chapter_data[0] if chapter_data else 0,
                "total_word_count": chapter_data[1] if chapter_data else 0,
                "generated_timestamp": chapter_data[2] if chapter_data else None
            } if chapter_data else None
        }
        
        return status
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Status check failed: {str(e)}"
        )

@router.get("/chapter/{chapter_number}/content")
async def get_chapter_content(project_name: str, chapter_number: int) -> Dict[str, Any]:
    """Get the generated chapter content"""
    
    db_path = f"projects/{project_name}/project.db"
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get complete chapter
        cursor.execute("""
            SELECT chapter_title, full_content, total_sections, total_word_count, generated_timestamp
            FROM academic_chapters 
            WHERE chapter_number = ?
        """, (chapter_number,))
        
        chapter_data = cursor.fetchone()
        
        if not chapter_data:
            raise HTTPException(
                status_code=404,
                detail=f"Chapter {chapter_number} not found"
            )
        
        # Get individual sections
        cursor.execute("""
            SELECT section_number, section_title, full_content, word_count, generated_timestamp
            FROM academic_sections 
            WHERE chapter_number = ?
            ORDER BY section_number
        """, (chapter_number,))
        
        sections = cursor.fetchall()
        conn.close()
        
        return {
            "project_name": project_name,
            "chapter_number": chapter_number,
            "chapter_title": chapter_data[0],
            "full_content": chapter_data[1],
            "metadata": {
                "total_sections": chapter_data[2],
                "total_word_count": chapter_data[3],
                "generated_timestamp": chapter_data[4]
            },
            "sections": [
                {
                    "section_number": row[0],
                    "section_title": row[1],
                    "content": row[2],
                    "word_count": row[3],
                    "generated_timestamp": row[4]
                } for row in sections
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Content retrieval failed: {str(e)}"
        )

@router.get("/projects/{project_name}/validate")
async def validate_project_for_academic_generation(project_name: str) -> Dict[str, Any]:
    """
    Validate that project has sufficient resources for academic chapter generation
    Checks both LightRAG buckets and SQL table structure
    """
    
    project_path = f"projects/{project_name}"
    
    validation_results = {
        "project_name": project_name,
        "project_exists": os.path.exists(project_path),
        "database_exists": os.path.exists(f"{project_path}/project.db"),
        "lightrag_exists": os.path.exists(f"{project_path}/lightrag"),
        "buckets_found": [],
        "tables_found": [],
        "ready_for_generation": False,
        "issues": [],
        "recommendations": []
    }
    
    if not validation_results["project_exists"]:
        validation_results["issues"].append(f"Project directory not found: {project_path}")
        return validation_results
    
    # Check LightRAG buckets
    lightrag_path = f"{project_path}/lightrag"
    if os.path.exists(lightrag_path):
        try:
            buckets = [d for d in os.listdir(lightrag_path) 
                      if os.path.isdir(os.path.join(lightrag_path, d))]
            validation_results["buckets_found"] = buckets
            
            # Check for key academic buckets
            expected_buckets = ["cook_sources", "bordwell_sources", "balio_sources", 
                              "cultural_sources", "reference_sources"]
            missing_buckets = [b for b in expected_buckets if b not in buckets]
            
            if missing_buckets:
                validation_results["issues"].append(f"Missing expected buckets: {missing_buckets}")
                validation_results["recommendations"].append(
                    "Upload source materials to the missing bucket categories"
                )
            
        except Exception as e:
            validation_results["issues"].append(f"Error reading LightRAG buckets: {e}")
    else:
        validation_results["issues"].append("No LightRAG directory found")
    
    # Check database and tables
    db_path = f"{project_path}/project.db"
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            validation_results["tables_found"] = tables
            
            # Check for film history tables (any that exist)
            film_history_tables = [t for t in tables if 'film_history' in t.lower() or 'markdown_outline' in t.lower()]
            
            if film_history_tables:
                validation_results["recommendations"].append(
                    f"✅ Found {len(film_history_tables)} film history tables: {film_history_tables}"
                )
            else:
                validation_results["recommendations"].append(
                    "📝 Consider importing film history CSV files for better academic structure"
                )
            
            conn.close()
            
        except Exception as e:
            validation_results["issues"].append(f"Error reading database: {e}")
    else:
        validation_results["issues"].append("Project database not found")
    
    # Overall readiness assessment
    validation_results["ready_for_generation"] = (
        validation_results["project_exists"] and
        validation_results["database_exists"] and
        validation_results["lightrag_exists"] and
        len(validation_results["buckets_found"]) >= 2  # Relaxed requirement
    )
    
    if validation_results["ready_for_generation"]:
        validation_results["recommendations"].append(
            "✅ Project is ready for academic chapter generation!"
        )
    else:
        validation_results["recommendations"].append(
            "❌ Address the issues above before attempting chapter generation"
        )
    
    return validation_results

@router.get("/projects/{project_name}/buckets")
async def list_project_buckets(project_name: str) -> Dict[str, Any]:
    """List available LightRAG buckets for the project"""
    
    lightrag_path = f"projects/{project_name}/lightrag"
    
    if not os.path.exists(lightrag_path):
        raise HTTPException(
            status_code=404,
            detail=f"LightRAG directory not found: {lightrag_path}"
        )
    
    try:
        buckets = []
        for item in os.listdir(lightrag_path):
            bucket_path = os.path.join(lightrag_path, item)
            if os.path.isdir(bucket_path):
                # Check if bucket has content
                files = os.listdir(bucket_path)
                has_content = len(files) > 0
                
                buckets.append({
                    "name": item,
                    "path": bucket_path,
                    "has_content": has_content,
                    "file_count": len(files)
                })
        
        return {
            "project_name": project_name,
            "lightrag_path": lightrag_path,
            "buckets": buckets,
            "total_buckets": len(buckets)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list buckets: {str(e)}"
        )

# Updated integration instructions for your backend/main.py
"""
To integrate this with your existing backend/main.py, add this after your existing includes:

# Academic Writing System
from backend.api.academic import routes as academic_routes
app.include_router(
    academic_routes.router, 
    prefix="/academic", 
    tags=["Academic Writing"]
)

Then you can use these endpoints:
- POST /academic/generate-chapter
- GET /academic/chapter/{chapter_number}/status?project_name=textbook_pilot  
- GET /academic/chapter/{chapter_number}/content?project_name=textbook_pilot
- GET /academic/projects/{project_name}/validate
- GET /academic/projects/{project_name}/buckets
"""
