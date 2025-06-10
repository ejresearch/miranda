Nell Beta - Backend Functionality Overview

This project combines LightRAG-powered vector search with SQLite-backed structured data to support advanced project workflows. Below is a summary of all currently implemented functionality across LightRAG, SQL, and GitHub integration.

📦 LightRAG Functions

Purpose: Manage semantic search buckets for document ingestion and hybrid retrieval.

Endpoint

Description

POST /api/buckets/new

Create a new LightRAG bucket

GET /api/buckets

List all existing buckets

DELETE /api/buckets/{bucket}

Delete a bucket

POST /api/buckets/{bucket}/ingest

Ingest a .txt file into a bucket

GET /api/buckets/{bucket}/files

List files inside a bucket

DELETE /api/buckets/{bucket}/files/{doc_id}

Delete a file from a bucket

POST /api/buckets/{bucket}/query

Query a bucket with a prompt and guidance

Initialization:

LightRAG is initialized in main.py on FastAPI startup

Uses OpenAI embeddings + GPT-4o mini for completion

📃 SQL Table Functions

Purpose: Manage structured project data using per-project SQLite databases.

Endpoint

Description

POST /api/tables/upload_csv

Upload a CSV and create a SQL table

GET /api/tables/{table_name}

View all rows in a table

GET /api/tables/{table_name}?column=...&value=...

Filter rows by a column value

GET /api/tables/list?project=...

List all tables inside a specific project database

Storage model:

Each project has its own SQLite file: projects/<project>/<project>.db

Tables are created via CSV upload with inferred schema

Future features include: add/edit/delete row, versioning, prompt-injection
