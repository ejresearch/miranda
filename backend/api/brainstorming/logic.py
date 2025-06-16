# backend/api/brainstorming/logic.py  
# =============================================================================

import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any

from lightrag import QueryParam  # ✅ ADDED: Import QueryParam
from backend.core.lightrag_singleton import get_lightrag
from backend.api.project_versions import save_version_to_db

PROJECTS_DIR = "projects"


def get_db_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, project_id, "project.db")


async def query_buckets(buckets: List[str], query: str) -> Dict[str, str]:
    """Query LightRAG buckets using the correct API"""
    lightrag = get_lightrag()  # This was already correct
    results = {}
    
    for bucket in buckets:
        # ✅ FIXED: Use correct LightRAG query method with QueryParam
        query_param = QueryParam(mode="hybrid", top_k=5)
        response = await lightrag.aquery(query, param=query_param)
        
        # Note: LightRAG returns a string response, not a list of hits
        results[bucket] = response
        
    return results


async def generate_brainstorm_output(
    project_id: str,
    scene_id: str,
    scene_description: str,
    selected_buckets: List[str],
    custom_prompt: str,
    tone: str,
    easter_egg: str
) -> Dict[str, Any]:
    """Generate brainstorm using proper LightRAG API"""
    lightrag = get_lightrag()  # This was already correct
    
    # Query buckets for context (if any buckets are selected)
    bucket_context = ""
    if selected_buckets:
        bucket_hits = await query_buckets(selected_buckets, scene_description)
        for name, content in bucket_hits.items():
            bucket_context += f"\n--- {name} ---\n{content}"

    # Construct the final prompt
    final_prompt = f"""You are a creative consultant generating ideas for a screenplay scene.

Scene Description:
{scene_description}

Tone: {tone}
Custom Instructions: {custom_prompt}
Easter Egg: {easter_egg}

{bucket_context if bucket_context else ""}

Now brainstorm specific ideas, patterns, or scene possibilities."""

    # ✅ Use the correct LightRAG API for generation
    result = await lightrag.llm_model_func(final_prompt)

    version_id = f"brainstorm_{int(datetime.now().timestamp())}"
    metadata = {
        "selectedSources": {
            "buckets": selected_buckets,
            "tables": [],
            "brainstormVersions": []
        },
        "customizations": {
            "tone": tone,
            "instructions": custom_prompt,
            "easter_egg": easter_egg
        },
        "dataSourcesCount": len(selected_buckets)
    }

    save_version_to_db(
        project_id=project_id,
        version_id=version_id,
        version_type="brainstorm",
        name=f"Brainstorm for {scene_id}",
        focus=scene_description,
        prompt=final_prompt,
        result=result,
        metadata_json=metadata
    )

    return {
        "version_id": version_id,
        "result": result,
        "prompt": final_prompt,
        "scene_id": scene_id
    }
