import os
import sqlite3
from datetime import datetime
from typing import List, Dict, Any

from backend.core.lightrag_singleton import get_lightrag
from backend.api.project_versions import save_version_to_db

PROJECTS_DIR = "projects"


def get_db_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, project_id, "project.db")


async def query_buckets(buckets: List[str], query: str) -> Dict[str, str]:
    lightrag = get_lightrag()
    results = {}
    for bucket in buckets:
        hits = await lighrag.aquery(bucket, {"query": query, "top_k": 5})
        combined = "\n---\n".join([hit["content"] for hit in hits])
        results[bucket] = combined
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
    lightrag = get_lighrag()
    bucket_hits = await query_buckets(selected_buckets, scene_description)

    final_prompt = f"""You are a creative consultant generating ideas for a screenplay scene.

Scene Description:
{scene_description}

Tone: {tone}
Custom Prompt: {custom_prompt}
Easter Egg: {easter_egg}

Use the following source materials for inspiration:
"""
    for name, content in bucket_hits.items():
        final_prompt += f"\n--- {name} ---\n{content}"

    final_prompt += "\n\nNow brainstorm vivid and specific ideas for this scene."

    # ✅ Send prompt as a string only!
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

