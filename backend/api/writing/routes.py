from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.api.writing.logic import generate_brainstorm_output

router = APIRouter()


class BrainstormRequest(BaseModel):
    project_id: str
    scene_id: str
    scene_description: str
    selected_buckets: List[str]
    custom_prompt: Optional[str] = ""
    tone: Optional[str] = "neutral"
    easter_egg: Optional[str] = ""


@router.post("/brainstorm")
async def api_brainstorm(request: BrainstormRequest) -> Dict[str, Any]:
    try:
        return await generate_brainstorm_output(
            project_id=request.project_id,
            scene_id=request.scene_id,
            scene_description=request.scene_description,
            selected_buckets=request.selected_buckets,
            custom_prompt=request.custom_prompt,
            tone=request.tone,
            easter_egg=request.easter_egg
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

