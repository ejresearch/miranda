from fastapi import FastAPI
from backend.api import buckets
from lightrag import LightRAG
from lightrag.llm.openai import openai_embed, gpt_4o_mini_complete

app = FastAPI()

@app.on_event("startup")
async def init_lightrag():
    global lightrag
    lightrag = LightRAG(
        working_dir="./lightrag_working_dir",
        embedding_func=openai_embed,
        llm_model_func=gpt_4o_mini_complete
    )

# Mount your API router from api/buckets.py
app.include_router(buckets.router, prefix="/api")

