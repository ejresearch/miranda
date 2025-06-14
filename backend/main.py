from fastapi import FastAPI
from backend.api import (
    buckets,
    sql_api,
    project_manager,
    project_versions
)
from backend.api.brainstorming import routes as brainstorming_routes
from backend.api.writing import routes as writing_routes

app = FastAPI()

app.include_router(buckets.router, prefix="/api")
app.include_router(sql_api.router, prefix="/api")
app.include_router(project_manager.router, prefix="/api")
app.include_router(project_versions.router, prefix="/api")
app.include_router(brainstorming_routes.router, prefix="/api")
app.include_router(writing_routes.router, prefix="/api")
