
# Nell Beta

Nell Beta is a comprehensive AI-powered project management system designed for **screenwriting**, **academic research**, and **content creation**. It combines document management, structured data analysis, AI brainstorming, and automated writing assistance into a unified workflow.

---

## 🚀 Key Features

- 🧠 **AI Brainstorming** — Generate insights from your documents using LightRAG vector search
- 📊 **Data Management** — Upload CSV files and create queryable SQL tables
- 📄 **Document Processing** — Organize files into semantic "buckets" for AI analysis
- ✍️ **AI Writing** — Create structured content using research and brainstorming outputs
- 📈 **Version Control** — Track and manage multiple iterations of your work
- 📤 **Export Options** — Download results as PDF, CSV, or JSON

---

## 🏗️ Architecture

```
frontend/document-manager/   # React frontend with Tailwind CSS
backend/                     # FastAPI backend
├── api/                     # API endpoints
│   ├── brainstorming/       # AI brainstorming logic
│   ├── writing/             # AI writing assistance
│   └── project_versions/    # Version management
├── core/                    # Core services
│   ├── lightrag_interface/  # Vector database integration
│   └── neo4j_interface/     # Graph database (optional)
└── main.py                  # FastAPI application
```

---

## ⚡ Quick Start

### ✅ Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key

### 🐍 Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd nell-beta

# Install Python dependencies
pip install fastapi uvicorn lightrag openai python-dotenv

# Set up environment variables
echo "OPENAI_API_KEY=your_key_here" > .env

# Start the backend server
uvicorn backend.main:app --reload --port 8000
```

### 🌐 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend/document-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to use the app.

---

## 📁 Project Templates

### 🎬 Screenplay Writing
- **Document Buckets:** `screenplay_examples`, `film_theory`, `character_guides`
- **Data Tables:** `character_types`, `scene_beats`, `story_structure`
- **Workflow:** Research → Structure → Brainstorm → Write → Export

### 📚 Academic Textbook
- **Document Buckets:** `primary_sources`, `academic_papers`, `film_analyses`
- **Data Tables:** `timeline_data`, `filmmaker_info`, `film_catalog`
- **Workflow:** Research → Data → Analysis → Writing → Export

### ⚙️ Custom Projects
- **Flexible Setup:** Define your own buckets, tables, and workflow
- **Adaptable:** Perfect for any research or creative project

---

## 🔌 API Endpoints

### Core Operations
```http
GET    /healthcheck
GET    /projects
POST   /projects/new
GET    /projects/{project_id}
```

### Document Management
```http
POST   /buckets/new
POST   /buckets/{bucket}/ingest
POST   /buckets/{bucket}/query
```

### Data Tables
```http
POST   /tables/upload_csv
GET    /tables/{table_name}
```

### AI Generation
```http
POST   /brainstorm
POST   /write
GET    /versions/{type}
POST   /versions/{type}
```

---

## 🧪 Example Workflow

1. **Create Project:** Choose a template (Screenplay, Textbook, or Custom)
2. **Upload Documents:** Add research files to semantic buckets
3. **Structure Data:** Upload CSV files with character info, timelines, etc.
4. **AI Brainstorming:** Generate insights by combining documents and data
5. **AI Writing:** Create structured content using all previous research
6. **Version Management:** Save, compare, and iterate on different versions
7. **Export:** Download final results in multiple formats

---

## 🧷 Sample Data

The repository includes example files under `nell_sample_project/`:

- **Text Documents:** AI ethics, memory research, design principles
- **CSV Data:** Researcher profiles, key terms, case studies
- **CURL Commands:** Full test suite for API endpoints

---

## 🧱 Technology Stack

### Backend:
- FastAPI (Python)
- LightRAG (Vector search)
- OpenAI GPT (Language generation)
- SQLite (Data storage)
- Neo4j (Optional graph storage)

### Frontend:
- React 19
- Tailwind CSS
- Lucide Icons
- Vite

---

## 🧪 Testing the API

### Sample CURL Commands

```bash
# Health check
curl -X GET "http://localhost:8000/healthcheck"

# Create a project
curl -X POST "http://localhost:8000/projects/new" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project"}'

# Upload a document
curl -X POST "http://localhost:8000/buckets/test_bucket/ingest" \
  -F "file=@nell_sample_project/01_ethics.txt"
```

Full test suite in: `nell_sample_project/CURL_Commands.txt`

---

## 🚧 Development Status

- ✅ Core Features Complete: Document upload, AI brainstorming, versioning
- ✅ API Testing: Complete CURL test suite
- 🚧 Frontend: React components in progress
- 🚧 Advanced Features: Graph export and Neo4j integration in development
