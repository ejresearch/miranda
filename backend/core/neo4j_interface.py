import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()  # will read NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD from your shell or a .env

_driver = None

def init_neo4j():
    global _driver
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    pw   = os.getenv("NEO4J_PASSWORD", "password")
    _driver = GraphDatabase.driver(uri, auth=(user, pw))

def close_neo4j():
    global _driver
    if _driver:
        _driver.close()

def write_graph(nodes: list[dict], relations: list[dict]):
    """
    nodes: list of {"id": str, "labels": [str], "props": {...}}
    relations: list of {"start": str, "end": str, "type": str, "props": {...}}
    """
    with _driver.session() as sess:
        # merge nodes
        for n in nodes:
            labels = ":" + ":".join(n["labels"])
            sess.run(
                f"MERGE (a{labels} {{id:$id}}) "
                "SET a += $props",
                id=n["id"], props=n["props"]
            )
        # merge relations
        for r in relations:
            sess.run(
                "MATCH (a {id:$start}), (b {id:$end}) "
                f"MERGE (a)-[rel:{r['type']}]->(b) "
                "SET rel += $props",
                start=r["start"], end=r["end"], props=r["props"]
            )

def fetch_graph(limit=100):
    with _driver.session() as sess:
        result = sess.run(
            "MATCH (a)-[r]->(b) "
            "RETURN a.id AS from, type(r) AS type, b.id AS to "
            "LIMIT $l",
            l=limit
        )
        return [dict(record) for record in result]

