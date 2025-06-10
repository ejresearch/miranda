# backend/core/lightrag_interface.py

import os
import shutil
import asyncio

from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import openai_embed, gpt_4o_mini_complete
from lightrag.kg.shared_storage import initialize_pipeline_status
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
    """
    FastAPI startup hook. Buckets themselves initialize on first use.
    """
    return

def _make_instance(bucket: str) -> LightRAG:
    """
    Construct a new LightRAG instance for `bucket` (storage not yet initialized).
    """
    bucket_path = os.path.join(WORKING_DIR, bucket)
    os.makedirs(bucket_path, exist_ok=True)
    return LightRAG(
        working_dir=bucket_path,
        embedding_func=openai_embed,
        llm_model_func=gpt_4o_mini_complete,
    )

async def _ensure_initialized(bucket: str) -> LightRAG:
    """
    Lazily create + initialize the LightRAG instance for `bucket` once.
    """
    if bucket not in _rag_instances:
        _rag_instances[bucket] = _make_instance(bucket)

    if bucket not in _initialized_buckets:
        rag = _rag_instances[bucket]
        await rag.initialize_storages()
        await initialize_pipeline_status()
        _initialized_buckets.add(bucket)

    return _rag_instances[bucket]

# ——— Public API ———

async def create_bucket(bucket: str):
    """Create an empty directory for a new bucket."""
    os.makedirs(os.path.join(WORKING_DIR, bucket), exist_ok=True)
    return {"status": "created", "bucket": bucket}

async def list_buckets():
    """Return all bucket names (subfolders under WORKING_DIR)."""
    return os.listdir(WORKING_DIR)

async def delete_bucket(bucket: str):
    """Delete a bucket folder and its LightRAG instance/data."""
    path = os.path.join(WORKING_DIR, bucket)
    if not os.path.isdir(path):
        raise FileNotFoundError(f"Bucket '{bucket}' not found.")
    shutil.rmtree(path)
    _rag_instances.pop(bucket, None)
    _initialized_buckets.discard(bucket)
    _bucket_docs.pop(bucket, None)
    return {"status": "deleted", "bucket": bucket}

async def ingest_file(bucket: str, file_path: str):
    """
    Read a text file and insert it into the given bucket’s RAG.
    Returns the generated doc_id.
    """
    rag = await _ensure_initialized(bucket)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Use the async insert to avoid event-loop conflicts
    doc_id = await rag.ainsert(content)
    _bucket_docs.setdefault(bucket, []).append(doc_id)
    return {"status": "success", "bucket": bucket, "doc_id": doc_id}

async def list_bucket_files(bucket: str):
    """List all doc_ids ingested into `bucket` during this run."""
    return _bucket_docs.get(bucket, [])

async def delete_file(bucket: str, doc_id: str):
    """Delete a single document from a bucket by its doc_id."""
    rag = await _ensure_initialized(bucket)
    await rag.delete(doc_id)
    if bucket in _bucket_docs and doc_id in _bucket_docs[bucket]:
        _bucket_docs[bucket].remove(doc_id)
    return {"status": "deleted", "bucket": bucket, "doc_id": doc_id}

async def query_bucket(bucket: str, query: str, user_prompt: str = "", mode: str = "hybrid"):
    """
    Run a retrieval-augmented generation query scoped to `bucket`.
    Returns the LLM’s response.
    """
    rag = await _ensure_initialized(bucket)
    param = QueryParam(mode=mode, user_prompt=user_prompt)
    # Use the async query to avoid event-loop conflicts
    result = await rag.aquery(query, param=param)
    return {"bucket": bucket, "result": result}

async def export_graph():
    """
    Return all entities & relations from the in-memory LightRAG graph:
      - nodes: list of {id, labels, props}
      - rels:  list of {start, end, type, props}
    """
    # Assuming rag.graph gives you access to its internal graph object
    g = rag.graph  
    nodes = []
    for n in g.nodes(data=True):
        nodes.append({
            "id":        n[0],
            "labels":    list(n[1].get("labels", [])),
            "props":     {k:v for k,v in n[1].items() if k != "labels"}
        })
    rels = []
    for u, v, data in g.edges(data=True):
        rels.append({
            "start": u,
            "end":   v,
            "type":  data.get("type", "RELATED"),
            "props": {k:v for k,v in data.items() if k != "type"}
        })
    return nodes, rels


