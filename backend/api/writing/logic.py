import os
import sqlite3
from datetime import datetime
from typing import List, Dict, Any

from backend.core.lightrag_singleton import get_lightrag
from backend.api.project_versions import save_version_to_db

PROJECTS_DIR = "projects"

def get_db_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, project_id, "project.db")

async def load_brainstorm_results(project_id: str, version_ids: List[str]) -> List[str]:
    db_path = get_db_path(project_id)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    results = []
    for vid in version_ids:
        cursor.execute("SELECT result FROM versions WHERE id = ? AND type = 'brainstorm'", (vid,))
        row = cursor.fetchone()
        if row:
            results.append(row[0])
    conn.close()
    return results

async def load_sql_table_data(project_id: str, table_name: str) -> List[Dict[str, Any]]:
    db_path = get_db_path(project_id)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    conn.close()
    return [dict(zip(columns, row)) for row in rows]

async def query_buckets(buckets: List[str], instructions: str) -> Dict[str, str]:
    lightrag = get_lightrag()
    results = {}
    for bucket in buckets:
        hits = await lightrag.aquery(bucket, instructions or "Summarize this bucket for a scene")
        combined = "\n---\n".join([h['content'] for h in hits])
        results[bucket] = combined
    return results

def build_prompt(tone: str, instructions: str, brainstorms: List[str],
                 tables: Dict[str, Any], buckets: Dict[str, str]) -> str:
    prompt = f"You are a screenwriter. Write a scene in a {tone} tone.\n"
    if instructions:
        prompt += f"Instructions: {instructions}\n"

    if brainstorms:
        prompt += "\n--- Brainstorm Insights ---\n"
        for b in brainstorms:
            prompt += f"{b}\n"

    if tables:
        prompt += "\n--- Reference Tables ---\n"
        for name, rows in tables.items():
            prompt += f"\n{name}:\n"
            for row in rows:
                prompt += f"- {row}\n"

    if buckets:
        prompt += "\n--- Retrieved Documents ---\n"
        for name, content in buckets.items():
            prompt += f"\n{name}:\n{content}\n"

    prompt += "\n--- Now write the scene:\n"
    return prompt

async def generate_written_output(
    project_id: str,
    prompt_tone: str,
    custom_instructions: str,
    selected_buckets: List[str],
    selected_tables: List[str],
    brainstorm_version_ids: List[str]
) -> Dict[str, Any]:
    brainstorms = await load_brainstorm_results(project_id, brainstorm_version_ids)
    tables = {t: await load_sql_table_data(project_id, t) for t in selected_tables}
    buckets = await query_buckets(selected_buckets, custom_instructions)

    final_prompt = build_prompt(prompt_tone, custom_instructions, brainstorms, tables, buckets)

    lightrag = get_lightrag()
    result = await lightrag.llm_model_func(final_prompt)

    version_id = f"write_{int(datetime.now().timestamp())}"
    metadata = {
        "selectedSources": {
            "buckets": selected_buckets,
            "tables": selected_tables,
            "brainstormVersions": brainstorm_version_ids
        },
        "customizations": {
            "tone": prompt_tone,
            "instructions": custom_instructions
        },
        "dataSourcesCount": len(selected_buckets) + len(selected_tables) + len(brainstorm_version_ids)
    }

    save_version_to_db(
        project_id=project_id,
        version_id=version_id,
        version_type="write",
        name=f"Write Output {datetime.now().isoformat()}",
        focus="Final Scene",
        prompt=final_prompt,
        result=result,
        metadata_json=metadata
    )

    return {
        "version_id": version_id,
        "result": result,
        "prompt": final_prompt,
        "sources": metadata
    }

