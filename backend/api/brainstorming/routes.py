# backend/api/brainstorming/routes.py

from fastapi import APIRouter, HTTPException, Query, Body
from backend.api.brainstorming.logic import run_brainstorming

router = APIRouter()

@router.post("/brainstorm")
async def brainstorm(
    project_name: str = Query(...),
    table_names: list[str] = Body(...),
    selected_rows: dict[str, list[int]] = Body(...),
    prompt_override: str = Body(""),
    user_note: str = Body(""),
):
    try:
        result = await run_brainstorming(
            project_name,
            table_names,
            selected_rows,
            prompt_override,
            user_note
        )
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

