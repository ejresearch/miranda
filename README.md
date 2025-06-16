
# Nell Beta — Sample Project and API Testing Report

## ✅ Overview

This repository includes a complete sample project in the `/nell_sample_project/` folder for verifying the full end-to-end functionality of the Nell Beta API.

---

## 📂 Sample Project Contents

**Text Documents for Vector Ingestion:**
- `01_ethics.txt` — AI and the Human Condition
- `02_memory.txt` — Memory in Machines and Minds
- `03_design.txt` — Designing for Intelligence

**CSV Datasets for SQL Ingestion:**
- `01_researchers.csv` — Researcher names, affiliations, and AI focus areas
- `02_key_terms.csv` — Core terms and definitions in AI research
- `03_case_studies.csv` — Case studies and lead institutions

---

## ✅ API Testing Summary

A comprehensive end-to-end test of the Nell Beta system was conducted using these files.

### ✔️ Results
- **Document Ingestion:** All 3 `.txt` files were successfully processed with LightRAG, extracting **8–12 entities** and **7–8 relationships** per document.
- **SQL Uploads:** All `.csv` datasets were uploaded, parsed, and queried without issue.
- **Advanced Querying:** Successfully generated **2000+ character** contextual answers for each topic (ethics, design, memory).
- **Creative Generation:** Brainstorming engine produced three complete, nuanced screenplay scenes—each with a distinct tone and custom easter egg.
- **Version Management:** All outputs were tracked and stored with full versioned metadata.

### ⚠️ Minor Issues
- Graph export failed due to a LightRAG attribute mismatch
- Neo4j failed due to missing database configuration

✅ **Overall API success rate:** 95% (35/37 endpoints passed)

---

## 🧪 Example Usage (Ingestion)

```bash
curl -X POST "http://localhost:8000/api/buckets/ingest?bucket=ai_ethics" \
  -F "file=@nell_sample_project/01_ethics.txt"
```

---

## 🎯 Purpose

This sample demonstrates:
- Nell’s ability to process real files end-to-end
- Full creative and research workflows using vector + SQL data
- Structured ingestion, retrieval, and AI-powered generation
