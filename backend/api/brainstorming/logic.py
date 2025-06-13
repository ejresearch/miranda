# backend/api/brainstorming/logic.py

import os
import sqlite3
from lightrag import QueryParam
from backend.core.lightrag_interface import query_bucket

async def run_brainstorming(project_name, table_names, selected_rows, prompt_override, user_note):
    db_path = os.path.join("projects", project_name, "project.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Gather structured input from selected rows
    structured_context = ""
    for table in table_names:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        for row_id in selected_rows.get(table, []):
            cursor.execute(f"SELECT * FROM {table} WHERE rowid = ?", (row_id,))
            row = cursor.fetchone()
            if row:
                row_data = dict(zip(columns, row))
                structured_context += f"\n[{table} row {row_id}]\n" + "\n".join(f"{k}: {v}" for k, v in row_data.items())

    conn.close()

    # Combine into prompt
    prompt = (
        f"{prompt_override.strip() if prompt_override else 'You are a creative ideation assistant.'}\n\n"
        f"User note: {user_note.strip()}\n\n"
        f"Context:\n{structured_context.strip()}\n\n"
        f"Brainstorm how this might be achieved."
    )

    # Query active bucket (for now, assume a hardcoded one like "scripts")
    result = await query_bucket("scripts", query=prompt, user_prompt="", mode="hybrid")
    return result["result"]

