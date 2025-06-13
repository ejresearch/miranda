from fastapi import FastAPI
from backend.api import buckets
from backend.api import sql_api
from backend.api import project_manager  # ⬅️ add this line
from backend.api.brainstorming import routes as brainstorming_routes
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

app.include_router(buckets.router, prefix="/api")
app.include_router(sql_api.router, prefix="/api")
app.include_router(brainstorming_routes.router, prefix="/api")
app.include_router(project_manager.router, prefix="/api")  # ⬅️ register project manager

