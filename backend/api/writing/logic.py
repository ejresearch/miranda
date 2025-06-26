# backend/api/writing/logic.py - COMPLETE REWRITE WITH PERPLEXITY SUPPORT

import os
import sqlite3
import json
import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional
import traceback

from lightrag import QueryParam
from backend.core.lightrag_singleton import get_lightrag
from backend.api.project_versions import save_version_to_db

PROJECTS_DIR = "projects"

# ===================================================================
# PERPLEXITY INTEGRATION
# ===================================================================

async def perplexity_model_complete(
    prompt: str,
    model: str = "llama-3.1-sonar-large-128k-online",
    **kwargs
) -> str:
    """
    Perplexity API completion function with fallback to OpenAI
    """
    api_key = os.getenv("PERPLEXITY_API_KEY")
    use_perplexity = os.getenv("USE_PERPLEXITY", "false").lower() == "true"
    
    if not use_perplexity or not api_key:
        print("[WRITING] Using OpenAI (Perplexity not configured)")
        # Fallback to existing LightRAG/OpenAI
        lightrag = get_lightrag()
        return await lightrag.llm_model_func(prompt)
    
    try:
        print(f"[WRITING] Using Perplexity API with model: {model}")
        
        # Prepare messages for Perplexity API
        messages = [{"role": "user", "content": prompt}]
        
        # API request payload
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": kwargs.get("max_tokens", 2000),
            "temperature": kwargs.get("temperature", 0.1),
            "top_p": kwargs.get("top_p", 0.9)
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            print(f"[WRITING] Perplexity generation successful: {len(content)} chars")
            return content
            
    except Exception as e:
        print(f"[ERROR] Perplexity API failed: {str(e)}")
        print("[WRITING] Falling back to OpenAI...")
        
        # Fallback to OpenAI
        try:
            lightrag = get_lightrag()
            return await lightrag.llm_model_func(prompt)
        except Exception as fallback_error:
            print(f"[ERROR] OpenAI fallback also failed: {str(fallback_error)}")
            return f"Content generation failed: {str(e)}"

# ===================================================================
# UTILITY FUNCTIONS
# ===================================================================

def get_db_path(project_id: str) -> str:
    """Get the database path for a project"""
    return os.path.join(PROJECTS_DIR, project_id, "project.db")

def validate_project_exists(project_id: str) -> str:
    """Validate project exists and return database path"""
    db_path = get_db_path(project_id)
    if not os.path.exists(db_path):
        print(f"[ERROR] Project database not found: {db_path}")
        raise FileNotFoundError(f"Project '{project_id}' does not exist")
    return db_path

def safe_database_operation(db_path: str, operation_name: str, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Safely execute database operations with comprehensive error handling"""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        cursor = conn.cursor()
        
        cursor.execute(query, params)
        
        if query.strip().upper().startswith('SELECT'):
            rows = cursor.fetchall()
            result = [dict(row) for row in rows]
        else:
            conn.commit()
            result = [{"rows_affected": cursor.rowcount}]
        
        conn.close()
        print(f"[WRITING] {operation_name} successful: {len(result)} items")
        return result
        
    except sqlite3.Error as e:
        print(f"[ERROR] Database error in {operation_name}: {str(e)}")
        return []
    except Exception as e:
        print(f"[ERROR] Unexpected error in {operation_name}: {str(e)}")
        return []

# ===================================================================
# BRAINSTORM RESULTS LOADING
# ===================================================================

async def load_brainstorm_results(project_id: str, version_ids: List[str]) -> List[str]:
    """Load brainstorm results with comprehensive error handling"""
    if not version_ids:
        print("[WRITING] No brainstorm version IDs provided")
        return []
    
    print(f"[WRITING] Loading {len(version_ids)} brainstorm results")
    
    try:
        db_path = validate_project_exists(project_id)
        results = []
        
        for vid in version_ids:
            if not vid or not isinstance(vid, str):
                print(f"[WARNING] Invalid version ID: {vid}")
                continue
                
            query_result = safe_database_operation(
                db_path,
                f"Load brainstorm {vid}",
                "SELECT result FROM versions WHERE id = ? AND type = 'brainstorm'",
                (vid,)
            )
            
            if query_result:
                result_text = query_result[0].get('result', '')
                if result_text and len(result_text.strip()) > 0:
                    results.append(result_text)
                    print(f"[WRITING] Loaded brainstorm {vid}: {len(result_text)} chars")
                else:
                    print(f"[WARNING] Empty brainstorm result for ID: {vid}")
            else:
                print(f"[WARNING] Brainstorm version not found: {vid}")
        
        print(f"[WRITING] Successfully loaded {len(results)} brainstorm results")
        return results
        
    except Exception as e:
        print(f"[ERROR] Failed to load brainstorm results: {str(e)}")
        return []

# ===================================================================
# SQL TABLE DATA LOADING
# ===================================================================

async def load_sql_table_data(project_id: str, table_name: str) -> List[Dict[str, Any]]:
    """Load SQL table data with comprehensive error handling"""
    if not table_name or not isinstance(table_name, str):
        print(f"[WARNING] Invalid table name: {table_name}")
        return []
    
    print(f"[WRITING] Loading table data: {table_name}")
    
    try:
        db_path = validate_project_exists(project_id)
        
        # First check if table exists
        table_check = safe_database_operation(
            db_path,
            f"Check table {table_name}",
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,)
        )
        
        if not table_check:
            print(f"[WARNING] Table '{table_name}' not found in project '{project_id}'")
            return []
        
        # Load table data
        table_data = safe_database_operation(
            db_path,
            f"Load table {table_name}",
            f'SELECT * FROM "{table_name}"'
        )
        
        if table_data:
            print(f"[WRITING] Loaded table '{table_name}': {len(table_data)} rows")
            return table_data
        else:
            print(f"[WARNING] Table '{table_name}' exists but contains no data")
            return []
            
    except Exception as e:
        print(f"[ERROR] Failed to load table '{table_name}': {str(e)}")
        return []

# ===================================================================
# BUCKET QUERYING (ENHANCED)
# ===================================================================

async def query_buckets(buckets: List[str], instructions: str, project_id: str = None) -> Dict[str, str]:
    """Query LightRAG buckets with comprehensive error handling"""
    if not buckets:
        print("[WRITING] No buckets provided for querying")
        return {}
    
    print(f"[WRITING] Querying {len(buckets)} buckets: {buckets}")
    results = {}
    
    try:
        lightrag = get_lightrag()
        if not lightrag:
            print("[ERROR] Failed to get LightRAG instance")
            return {bucket: "[Error: LightRAG not available]" for bucket in buckets}
        
    except Exception as e:
        print(f"[ERROR] Failed to initialize LightRAG: {str(e)}")
        return {bucket: f"[Error: LightRAG initialization failed - {str(e)}]" for bucket in buckets}
    
    for bucket in buckets:
        if not bucket or not isinstance(bucket, str):
            print(f"[WARNING] Invalid bucket name: {bucket}")
            results[str(bucket)] = "[Error: Invalid bucket name]"
            continue
            
        try:
            print(f"[WRITING] Querying bucket: {bucket}")
            
            # Prepare query text
            if instructions and len(instructions.strip()) > 0:
                query_text = f"{instructions.strip()}\n\nContext from {bucket}:"
            else:
                query_text = f"Summarize content from {bucket} for writing context"
            
            # Query with proper error handling
            query_param = QueryParam(mode="hybrid", top_k=5)
            response = await lightrag.aquery(query_text, param=query_param)
            
            # Validate and process response
            if not response:
                print(f"[WARNING] Empty response from bucket '{bucket}'")
                results[bucket] = f"[No content available in {bucket}]"
            elif isinstance(response, str) and len(response.strip()) < 10:
                print(f"[WARNING] Very short response from bucket '{bucket}': {len(response)} chars")
                results[bucket] = f"[Limited content found in {bucket}]"
            else:
                # Successful response
                response_str = str(response).strip()
                results[bucket] = response_str
                print(f"[WRITING] Successfully queried bucket '{bucket}': {len(response_str)} chars")
                
        except ImportError as e:
            print(f"[ERROR] LightRAG import error for bucket '{bucket}': {str(e)}")
            results[bucket] = f"[Error: LightRAG module issue - {str(e)}]"
        except ConnectionError as e:
            print(f"[ERROR] Connection error querying bucket '{bucket}': {str(e)}")
            results[bucket] = f"[Error: Connection failed for {bucket}]"
        except TimeoutError as e:
            print(f"[ERROR] Timeout querying bucket '{bucket}': {str(e)}")
            results[bucket] = f"[Error: Query timeout for {bucket}]"
        except Exception as e:
            print(f"[ERROR] Unexpected error querying bucket '{bucket}': {str(e)}")
            print(f"[ERROR] Exception type: {type(e).__name__}")
            traceback.print_exc()
            results[bucket] = f"[Error accessing {bucket}: {type(e).__name__}]"
    
    print(f"[WRITING] Bucket querying complete: {len(results)} results")
    return results

# ===================================================================
# PROMPT BUILDING
# ===================================================================

def build_prompt(
    tone: str, 
    instructions: str, 
    brainstorms: List[str],
    tables: Dict[str, List[Dict[str, Any]]], 
    buckets: Dict[str, str]
) -> str:
    """Build comprehensive prompt from all data sources"""
    
    print(f"[WRITING] Building prompt with tone='{tone}', {len(brainstorms)} brainstorms, {len(tables)} tables, {len(buckets)} buckets")
    
    # Start with base instruction
    prompt_parts = []
    
    # Tone and style guidance
    if tone and tone.strip():
        tone_guidance = {
            "creative": "Write in a creative, imaginative style with vivid descriptions and engaging narrative.",
            "professional": "Write in a clear, professional tone suitable for business communication.",
            "academic": "Write in a formal, scholarly style with proper structure and analytical depth.",
            "technical": "Write with precision and technical accuracy, focusing on clear explanations.",
            "casual": "Write in a conversational, approachable tone that's easy to understand.",
            "dramatic": "Write with emotional intensity and compelling dramatic tension.",
            "neutral": "Write in a balanced, objective tone."
        }
        
        tone_instruction = tone_guidance.get(tone.lower(), f"Write in a {tone} tone.")
        prompt_parts.append(f"TONE: {tone_instruction}")
    
    # Custom instructions
    if instructions and instructions.strip():
        prompt_parts.append(f"INSTRUCTIONS: {instructions.strip()}")
    
    # Add brainstorm insights
    if brainstorms:
        prompt_parts.append("\n--- BRAINSTORM INSIGHTS ---")
        for i, brainstorm in enumerate(brainstorms, 1):
            if brainstorm and len(brainstorm.strip()) > 0:
                prompt_parts.append(f"Brainstorm {i}:\n{brainstorm.strip()}")
    
    # Add table data
    if tables:
        prompt_parts.append("\n--- REFERENCE DATA ---")
        for table_name, rows in tables.items():
            if rows:
                prompt_parts.append(f"\n{table_name.upper()} DATA:")
                for i, row in enumerate(rows[:5], 1):  # Limit to first 5 rows
                    row_summary = ", ".join([f"{k}: {v}" for k, v in row.items() if v])
                    prompt_parts.append(f"  {i}. {row_summary}")
                if len(rows) > 5:
                    prompt_parts.append(f"  ... and {len(rows) - 5} more entries")
    
    # Add bucket content
    if buckets:
        prompt_parts.append("\n--- RESEARCH CONTEXT ---")
        for bucket_name, content in buckets.items():
            if content and len(content.strip()) > 0 and not content.startswith("[Error"):
                # Truncate very long content
                display_content = content.strip()
                if len(display_content) > 1000:
                    display_content = display_content[:1000] + "... [content truncated]"
                prompt_parts.append(f"\nFrom {bucket_name}:\n{display_content}")
    
    # Final instruction
    prompt_parts.append("\n--- TASK ---")
    prompt_parts.append("Using all the above information, create compelling, well-structured content that incorporates the relevant insights, data, and context provided.")
    
    final_prompt = "\n\n".join(prompt_parts)
    
    print(f"[WRITING] Built prompt: {len(final_prompt)} characters")
    return final_prompt

# ===================================================================
# MAIN GENERATION FUNCTION (WITH PERPLEXITY SUPPORT)
# ===================================================================

async def generate_written_output(
    project_id: str,
    prompt_tone: str,
    custom_instructions: str,
    selected_buckets: List[str],
    selected_tables: List[str],
    brainstorm_version_ids: List[str]
) -> Dict[str, Any]:
    """Generate written content with Perplexity support and comprehensive error handling"""
    
    # Input validation
    if not project_id or not isinstance(project_id, str):
        return {
            "version_id": None,
            "result": "Error: Invalid project ID provided",
            "prompt": "",
            "sources": {},
            "status": "error",
            "error": "Invalid project ID"
        }
    
    print(f"[WRITING] ===== STARTING CONTENT GENERATION =====")
    print(f"[WRITING] Project: {project_id}")
    print(f"[WRITING] Tone: {prompt_tone}")
    print(f"[WRITING] Instructions: {custom_instructions[:100]}..." if custom_instructions else "[WRITING] No custom instructions")
    print(f"[WRITING] Buckets: {selected_buckets}")
    print(f"[WRITING] Tables: {selected_tables}")
    print(f"[WRITING] Brainstorms: {brainstorm_version_ids}")
    
    generation_start_time = datetime.now()
    
    try:
        # Validate project exists
        validate_project_exists(project_id)
        
        # Initialize data containers
        brainstorms = []
        tables = {}
        buckets = {}
        
        # Load brainstorm results
        print(f"[WRITING] === LOADING BRAINSTORMS ===")
        if brainstorm_version_ids:
            try:
                brainstorms = await load_brainstorm_results(project_id, brainstorm_version_ids)
                print(f"[WRITING] Loaded {len(brainstorms)} brainstorm results")
            except Exception as e:
                print(f"[ERROR] Failed to load brainstorms: {str(e)}")
                brainstorms = []
        
        # Load table data
        print(f"[WRITING] === LOADING TABLES ===")
        if selected_tables:
            for table_name in selected_tables:
                try:
                    table_data = await load_sql_table_data(project_id, table_name)
                    if table_data:
                        tables[table_name] = table_data
                        print(f"[WRITING] Loaded table '{table_name}': {len(table_data)} rows")
                    else:
                        print(f"[WARNING] No data found in table '{table_name}'")
                except Exception as e:
                    print(f"[ERROR] Failed to load table '{table_name}': {str(e)}")
        
        # Query buckets
        print(f"[WRITING] === QUERYING BUCKETS ===")
        if selected_buckets:
            try:
                buckets = await query_buckets(selected_buckets, custom_instructions, project_id)
                print(f"[WRITING] Queried {len(buckets)} buckets successfully")
            except Exception as e:
                print(f"[ERROR] Failed to query buckets: {str(e)}")
                buckets = {bucket: f"[Error accessing bucket: {str(e)}]" for bucket in selected_buckets}
        
        # Build comprehensive prompt
        print(f"[WRITING] === BUILDING PROMPT ===")
        try:
            final_prompt = build_prompt(prompt_tone, custom_instructions, brainstorms, tables, buckets)
            print(f"[WRITING] Built prompt: {len(final_prompt)} characters")
        except Exception as e:
            print(f"[ERROR] Failed to build prompt: {str(e)}")
            final_prompt = f"Error building prompt: {str(e)}"
        
        # Generate content with Perplexity or OpenAI
        print(f"[WRITING] === GENERATING CONTENT ===")
        try:
            result = await perplexity_model_complete(final_prompt)
            
            if not result or len(result.strip()) < 10:
                print(f"[WARNING] Generated content is very short: {len(result) if result else 0} chars")
                result = result or "Content generation completed but no content was returned."
            else:
                print(f"[WRITING] Generated content: {len(result)} characters")
                
        except Exception as e:
            print(f"[ERROR] Content generation failed: {str(e)}")
            traceback.print_exc()
            result = f"Content generation failed: {str(e)}"
        
        # Create version metadata
        generation_end_time = datetime.now()
        generation_duration = (generation_end_time - generation_start_time).total_seconds()
        
        # Check if Perplexity was used
        perplexity_used = (
            os.getenv("USE_PERPLEXITY", "false").lower() == "true" and 
            os.getenv("PERPLEXITY_API_KEY") is not None
        )
        
        metadata = {
            "selectedSources": {
                "buckets": selected_buckets or [],
                "tables": selected_tables or [],
                "brainstormVersions": brainstorm_version_ids or []
            },
            "customizations": {
                "tone": prompt_tone or "neutral",
                "instructions": custom_instructions or ""
            },
            "dataSourcesCount": len(selected_buckets or []) + len(selected_tables or []) + len(brainstorm_version_ids or []),
            "generation": {
                "start_time": generation_start_time.isoformat(),
                "end_time": generation_end_time.isoformat(),
                "duration_seconds": generation_duration,
                "prompt_length": len(final_prompt),
                "result_length": len(result) if result else 0,
                "model_used": "perplexity" if perplexity_used else "openai"
            },
            "status": "success" if result and not result.startswith("Error") else "error"
        }
        
        # Save version to database
        print(f"[WRITING] === SAVING VERSION ===")
        version_id = f"write_{int(generation_start_time.timestamp())}"
        
        try:
            save_version_to_db(
                project_id=project_id,
                version_id=version_id,
                version_type="write",
                name=f"AI Writing - {generation_start_time.strftime('%Y-%m-%d %H:%M')}",
                focus=f"Generated using {metadata['dataSourcesCount']} sources",
                prompt=final_prompt,
                result=result,
                metadata_json=metadata
            )
            print(f"[WRITING] Saved version: {version_id}")
        except Exception as e:
            print(f"[ERROR] Failed to save version: {str(e)}")
            # Continue anyway, return the result even if saving failed
        
        print(f"[WRITING] ===== GENERATION COMPLETE =====")
        print(f"[WRITING] Duration: {generation_duration:.2f} seconds")
        print(f"[WRITING] Content length: {len(result)} characters")
        print(f"[WRITING] Model used: {'Perplexity' if perplexity_used else 'OpenAI'}")
        
        return {
            "version_id": version_id,
            "result": result,
            "prompt": final_prompt,
            "sources": metadata,
            "status": "success",
            "generation_time": generation_duration,
            "model_used": "perplexity" if perplexity_used else "openai"
        }
        
    except FileNotFoundError as e:
        print(f"[ERROR] Project not found: {str(e)}")
        return {
            "version_id": None,
            "result": f"Project not found: {str(e)}",
            "prompt": "",
            "sources": {},
            "status": "error",
            "error": "project_not_found"
        }
    except Exception as e:
        print(f"[ERROR] Unexpected error in content generation: {str(e)}")
        traceback.print_exc()
        
        return {
            "version_id": None,
            "result": f"Content generation failed due to unexpected error: {str(e)}",
            "prompt": custom_instructions or "",
            "sources": {
                "selectedSources": {
                    "buckets": selected_buckets or [],
                    "tables": selected_tables or [],
                    "brainstormVersions": brainstorm_version_ids or []
                },
                "error": str(e),
                "error_type": type(e).__name__
            },
            "status": "error",
            "error": str(e)
        }
