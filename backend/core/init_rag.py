import os
from lightrag import LightRAG

def init_rag(bucket_name: str) -> LightRAG:
    storage_dir = os.path.join("backend", "lightrag_storage", bucket_name)
    os.makedirs(storage_dir, exist_ok=True)

    # LightRAG will use default embedding/LLM behavior unless you override via config
    return LightRAG(
        working_dir=storage_dir
    )

