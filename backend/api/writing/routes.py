from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.api.writing.logic import generate_written_output

router = APIRouter()

class WriteRequest(BaseModel):
    project_id: str
    prompt_tone: str = "neutral"
    custom_instructions: str = ""
    selected_buckets: List[str] = []
    selected_tables: List[str] = []
    brainstorm_version_ids: List[str] = []

@router.post("/write")
async def generate_writing(request: WriteRequest) -> Dict[str, Any]:
    """Generate AI-powered written content using selected data sources"""
    try:
        return await generate_written_output(
            project_id=request.project_id,
            prompt_tone=request.prompt_tone,
            custom_instructions=request.custom_instructions,
            selected_buckets=request.selected_buckets,
            selected_tables=request.selected_tables,
            brainstorm_version_ids=request.brainstorm_version_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/write/templates")
async def get_writing_templates() -> List[Dict[str, str]]:
    """Return predefined writing templates for different content types"""
    return [
        {
            "name": "Academic",
            "tone": "formal",
            "description": "Scholarly writing style with citations and formal language",
            "example_instructions": "Write in an academic tone with proper citations and formal structure"
        },
        {
            "name": "Creative",
            "tone": "creative",
            "description": "Imaginative and expressive writing for storytelling",
            "example_instructions": "Use vivid imagery, compelling characters, and engaging narrative"
        },
        {
            "name": "Business",
            "tone": "professional",
            "description": "Clear and persuasive business communication",
            "example_instructions": "Focus on clarity, actionable insights, and professional tone"
        },
        {
            "name": "Technical",
            "tone": "technical",
            "description": "Precise and detailed technical documentation",
            "example_instructions": "Use precise technical language with clear explanations and examples"
        }
    ]

@router.get("/write/status/{project_id}")
async def get_writing_status(project_id: str) -> Dict[str, Any]:
    """Get writing status and recent outputs for a project"""
    from backend.api.project_versions import get_db_path
    import sqlite3
    import os
    
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get recent write versions
        cursor.execute("""
            SELECT id, name, created, result 
            FROM versions 
            WHERE project_id = ? AND type = 'write' 
            ORDER BY created DESC 
            LIMIT 5
        """, (project_id,))
        
        recent_writes = []
        for row in cursor.fetchall():
            recent_writes.append({
                "id": row[0],
                "name": row[1],
                "created": row[2],
                "preview": row[3][:200] + "..." if len(row[3]) > 200 else row[3]
            })
        
        conn.close()
        
        return {
            "project_id": project_id,
            "total_writes": len(recent_writes),
            "recent_writes": recent_writes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
