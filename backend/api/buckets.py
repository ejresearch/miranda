# backend/api/buckets.py

import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File

from backend.core.lightrag_interface import (
    create_bucket, list_buckets, delete_bucket,
    ingest_file, list_bucket_files, delete_file, query_bucket,
)

router = APIRouter()


@router.post("/buckets/new")
async def api_create_bucket(body: dict):
    bucket = body.get("bucket")
    if not bucket:
        raise HTTPException(status_code=400, detail="Must provide 'bucket'")
    return await create_bucket(bucket)


@router.get("/buckets")
async def api_list_buckets():
    return await list_buckets()


@router.delete("/buckets/{bucket}")
async def api_delete_bucket(bucket: str):
    return await delete_bucket(bucket)


@router.post("/buckets/{bucket}/ingest")
async def api_ingest(bucket: str, file: UploadFile = File(...)):
    print(f"\n[LIGHTRAG INGEST] Bucket: {bucket}")
    print(f"[LIGHTRAG INGEST] File name: {file.filename}")

    suffix = os.path.splitext(file.filename)[1] or ".txt"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    print(f"[LIGHTRAG INGEST] Temp file saved at: {tmp_path}")
    print(f"[LIGHTRAG INGEST] File contents:\n{contents.decode('utf-8')}\n")

    try:
        result = await ingest_file(bucket, tmp_path)
        print(f"[LIGHTRAG INGEST] Ingest result: {result}")
        return result
    finally:
        os.remove(tmp_path)


@router.get("/buckets/{bucket}/files")
async def api_list_files(bucket: str):
    return await list_bucket_files(bucket)


@router.delete("/buckets/{bucket}/files/{doc_id}")
async def api_delete_file(bucket: str, doc_id: str):
    return await delete_file(bucket, doc_id)


@router.post("/buckets/{bucket}/query")
async def api_query(bucket: str, payload: dict):
    query = payload.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Must provide 'query'")
    user_prompt = payload.get("user_prompt", "")
    return await query_bucket(bucket, query, user_prompt=user_prompt)

@router.get("/buckets/export_graph")
async def api_export_graph():
    from backend.core.lightrag_interface import export_graph
    return await export_graph()

# Re-export router for FastAPI app
router = router

