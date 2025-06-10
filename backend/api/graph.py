from fastapi import APIRouter, HTTPException
from backend.core.lightrag_interface import export_graph
from backend.core.neo4j_interface import write_graph, fetch_graph

router = APIRouter(tags=["graph"])

@router.post("/graph/push")
async def api_push_graph():
    try:
        nodes, rels = await export_graph()
        write_graph(nodes, rels)
        return {"status":"ok", "nodes":len(nodes), "relations":len(rels)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/all")
def api_fetch_graph(limit: int = 100):
    return fetch_graph(limit)

