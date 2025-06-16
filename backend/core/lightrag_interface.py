# backend/core/lightrag_interface.py

import os
import shutil
import asyncio

from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import openai_embed, gpt_4o_mini_complete
from lightrag.kg.shared_storage import initialize_pipeline_status  # ✅ Critical import
from lightrag.utils import setup_logger

# Initialize LightRAG logging
setup_logger("lightrag", level="INFO")

# Working directory for all bucket subfolders
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKING_DIR = os.path.join(BASE_DIR, "lightrag_working_dir")
os.makedirs(WORKING_DIR, exist_ok=True)

# In-memory caches
_rag_instances: dict[str, LightRAG] = {}
_initialized_buckets: set[str] = set()
_bucket_docs: dict[str, list[str]] = {}

async def init_rag():
    """FastAPI startup hook (noop)."""
    return

def _make_instance(bucket: str) -> LightRAG:
    bucket_path = os.path.join(WORKING_DIR, bucket)
    os.makedirs(bucket_path, exist_ok=True)
    
    print(f"[LIGHTRAG] Creating LightRAG instance for bucket: {bucket}")
    print(f"[LIGHTRAG] Working directory: {bucket_path}")
    
    return LightRAG(
        working_dir=bucket_path,
        embedding_func=openai_embed,
        llm_model_func=gpt_4o_mini_complete,
    )

async def _ensure_initialized(bucket: str) -> LightRAG:
    if bucket not in _rag_instances:
        print(f"[LIGHTRAG] Creating new LightRAG instance for bucket: {bucket}")
        _rag_instances[bucket] = _make_instance(bucket)
    
    if bucket not in _initialized_buckets:
        print(f"[LIGHTRAG] Initializing LightRAG for bucket: {bucket}")
        rag = _rag_instances[bucket]
        
        # ✅ CRITICAL: These two initialization calls are required!
        print(f"[LIGHTRAG] Step 1: Initializing storages...")
        await rag.initialize_storages()  # Initialize storage backends
        
        print(f"[LIGHTRAG] Step 2: Initializing pipeline status...")
        await initialize_pipeline_status()  # Initialize processing pipeline
        
        _initialized_buckets.add(bucket)
        print(f"[LIGHTRAG] ✅ Bucket {bucket} fully initialized")
    
    return _rag_instances[bucket]

# ——— Public API ———

async def create_bucket(bucket: str):
    bucket_path = os.path.join(WORKING_DIR, bucket)
    os.makedirs(bucket_path, exist_ok=True)
    print(f"[LIGHTRAG] Created bucket directory: {bucket_path}")
    return {"status": "created", "bucket": bucket}

async def list_buckets():
    buckets = os.listdir(WORKING_DIR)
    print(f"[LIGHTRAG] Available buckets: {buckets}")
    return buckets

async def delete_bucket(bucket: str):
    path = os.path.join(WORKING_DIR, bucket)
    if not os.path.isdir(path):
        raise FileNotFoundError(f"Bucket '{bucket}' not found.")
    
    # Clean up instance before deleting
    if bucket in _rag_instances:
        rag = _rag_instances[bucket]
        try:
            await rag.finalize_storages()  # Proper cleanup
        except:
            pass  # Ignore cleanup errors
    
    shutil.rmtree(path)
    _rag_instances.pop(bucket, None)
    _initialized_buckets.discard(bucket)
    _bucket_docs.pop(bucket, None)
    return {"status": "deleted", "bucket": bucket}

async def ingest_file(bucket: str, file_path: str):
    print(f"[LIGHTRAG] 🚀 Starting document ingestion")
    print(f"[LIGHTRAG] Bucket: {bucket}")
    print(f"[LIGHTRAG] File: {file_path}")
    
    # Ensure LightRAG is properly initialized
    rag = await _ensure_initialized(bucket)
    
    # Read file content
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    print(f"[LIGHTRAG] Document length: {len(content)} characters")
    print(f"[LIGHTRAG] Content preview: {content[:200]}...")
    
    try:
        print(f"[LIGHTRAG] 📝 Calling rag.ainsert() - this should trigger full processing pipeline")
        
        # This should now trigger the full LightRAG pipeline:
        # 1. Text chunking
        # 2. Entity extraction (via LLM)
        # 3. Relationship extraction (via LLM) 
        # 4. Embedding generation
        # 5. Vector storage
        # 6. Knowledge graph construction
        doc_id = await rag.ainsert(content)
        
        print(f"[LIGHTRAG] ✅ Document processing completed!")
        print(f"[LIGHTRAG] Document ID: {doc_id}")
        
        # Verify that processing actually happened
        print(f"[LIGHTRAG] 🔍 Checking storage state after processing...")
        
        # Check entities
        if hasattr(rag, 'entities_vdb') and rag.entities_vdb:
            entity_count = len(rag.entities_vdb.data) if hasattr(rag.entities_vdb, 'data') else 0
            print(f"[LIGHTRAG] 🎯 Entities stored: {entity_count}")
        
        # Check relationships  
        if hasattr(rag, 'relationships_vdb') and rag.relationships_vdb:
            rel_count = len(rag.relationships_vdb.data) if hasattr(rag.relationships_vdb, 'data') else 0
            print(f"[LIGHTRAG] 🔗 Relationships stored: {rel_count}")
            
        # Check chunks
        if hasattr(rag, 'chunks_vdb') and rag.chunks_vdb:
            chunk_count = len(rag.chunks_vdb.data) if hasattr(rag.chunks_vdb, 'data') else 0
            print(f"[LIGHTRAG] 📄 Chunks stored: {chunk_count}")
        
        # fallback if no doc_id was returned
        if not doc_id:
            doc_id = f"doc-{hash(content)}"
            print(f"[LIGHTRAG] Generated fallback doc_id: {doc_id}")
        
        _bucket_docs.setdefault(bucket, []).append(doc_id)
        
        return {"status": "success", "bucket": bucket, "doc_id": doc_id}
        
    except Exception as e:
        print(f"[LIGHTRAG] ❌ Error during document processing:")
        print(f"[LIGHTRAG] Error type: {type(e).__name__}")
        print(f"[LIGHTRAG] Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

async def list_bucket_files(bucket: str):
    docs = _bucket_docs.get(bucket, [])
    return [{"doc_id": doc_id, "filename": "unknown"} for doc_id in docs]

async def delete_file(bucket: str, doc_id: str):
    rag = await _ensure_initialized(bucket)
    await rag.delete(doc_id)
    if bucket in _bucket_docs and doc_id in _bucket_docs[bucket]:
        _bucket_docs[bucket].remove(doc_id)
    return {"status": "deleted", "bucket": bucket, "doc_id": doc_id}

async def query_bucket(bucket: str, query: str, user_prompt: str = "", mode: str = "hybrid"):
    print(f"[LIGHTRAG] 🔍 Query request:")
    print(f"[LIGHTRAG] Bucket: {bucket}")
    print(f"[LIGHTRAG] Query: {query[:100]}...")
    print(f"[LIGHTRAG] Mode: {mode}")
    
    rag = await _ensure_initialized(bucket)
    combined_query = f"{user_prompt.strip()}\n\n{query.strip()}" if user_prompt else query.strip()
    
    try:
        # Use the official QueryParam class
        query_param = QueryParam(mode=mode)
        result = await rag.aquery(combined_query, param=query_param)
        
        print(f"[LIGHTRAG] ✅ Query successful!")
        print(f"[LIGHTRAG] Result length: {len(result) if result else 0}")
        print(f"[LIGHTRAG] Result preview: {result[:200] if result else 'No result'}...")
        
        return {"bucket": bucket, "result": result}
        
    except Exception as e:
        print(f"[LIGHTRAG] ❌ Query failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"bucket": bucket, "result": "Sorry, I'm not able to provide an answer to that question.[query-error]"}

async def export_graph():
    if not _rag_instances:
        return {"nodes": [], "rels": []}
    rag = list(_rag_instances.values())[0]
    g = rag.graph
    nodes = [
        {
            "id": n[0],
            "labels": list(n[1].get("labels", [])),
            "props": {k: v for k, v in n[1].items() if k != "labels"},
        }
        for n in g.nodes(data=True)
    ]
    rels = [
        {
            "start": u,
            "end": v,
            "type": data.get("type", "RELATED"),
            "props": {k: v for k, v in data.items() if k != "type"},
        }
        for u, v, data in g.edges(data=True)
    ]
    return nodes, rels
