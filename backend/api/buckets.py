# backend/api/buckets.py
import os, tempfile
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
        raise HTTPException(400, "must provide 'bucket'")
    return await create_bucket(bucket)

@router.get("/buckets")
async def api_list_buckets():
    return await list_buckets()

@router.delete("/buckets/{bucket}")
async def api_delete_bucket(bucket: str):
    return await delete_bucket(bucket)

@router.post("/buckets/{bucket}/ingest")
async def api_ingest(bucket: str, file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".txt"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        return await ingest_file(bucket, tmp_path)
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
    q = payload.get("query")
    if not q:
        raise HTTPException(400, "must provide 'query'")
    return await query_bucket(
        bucket,
        q,
        user_prompt=payload.get("user_prompt", ""),
        mode=payload.get("mode", "hybrid"),
    )

router = router  # expose for main.py

