# Nell Beta - Complete Testing Documentation

## 📖 **TL;DR**
**Quick validation that your Nell Beta backend is bulletproof**: Run 25+ CURL commands to test every import, feature, and edge case. Creates sample CSV files and documents, uploads them, generates AI content using multiple data sources, exports everything, and validates error handling. Takes 10 minutes to run, confirms 100% backend functionality including LightRAG document processing, multi-source AI writing, template system with 6 project types, CSV upload with pandas, export system, and auto-repair. If all tests pass (expect 200 responses, generated content >1000 chars, proper file downloads), your backend is production-ready for frontend development. **Key test**: Upload CSV → Upload documents → Generate AI content → Export project = Full workflow validated.

## 🎯 **Overview**
This document provides comprehensive testing commands for Nell Beta, an AI-powered project management system that combines document processing, structured data management, and AI content generation.

---

## 📋 **Prerequisites**

### **Environment Setup**
```bash
# 1. Navigate to project directory
cd nell_beta_3

# 2. Activate virtual environment
source lizzy_env/bin/activate

# 3. Set OpenAI API key (replace with your key)
export OPENAI_API_KEY="your_openai_api_key_here"

# 4. Start the server
uvicorn backend.main:app --reload --port 8000

# 5. Verify server is running (should see startup logs)
# Look for: "Uvicorn running on http://127.0.0.1:8000"
```

### **Dependencies**
- Python 3.9+
- FastAPI
- LightRAG
- OpenAI API access
- Pandas (for CSV processing)

---

## 🧪 **Basic Health and Import Tests**

### **Test 1: Server Health Check**
```bash
# Tests: Basic server functionality and API availability
curl http://127.0.0.1:8000/healthcheck
```
**Purpose**: Verifies the FastAPI server is running and responding  
**Expected Response**: `{"status":"ok"}`  
**What it validates**: Core server imports and basic routing

---

### **Test 2: Project Management System**
```bash
# Tests: Project manager module import and database listing
curl http://127.0.0.1:8000/projects/projects
```
**Purpose**: Validates project manager module and project listing functionality  
**Expected Response**: JSON with projects array and detailed project information  
**What it validates**: 
- `backend.api.project_manager` import
- SQLite database access
- Project directory scanning
- Metadata loading

---

### **Test 3: Template System**
```bash
# Tests: Template module import and template definitions
curl http://127.0.0.1:8000/templates/templates
```
**Purpose**: Validates template system with all 6 built-in project types  
**Expected Response**: JSON with template objects for screenplay, academic, business, etc.  
**What it validates**:
- `backend.api.templates` import
- Template data structures
- Category organization
- Sample data availability

---

## 🏗️ **Project Creation and Management**

### **Test 4: Manual Project Creation**
```bash
# Tests: Project creation API and database initialization
curl -X POST http://127.0.0.1:8000/projects/projects/new \
  -H 'Content-Type: application/json' \
  -d '{"name": "test_project", "description": "Testing project creation"}'
```
**Purpose**: Creates a new project from scratch with auto-repair functionality  
**Expected Response**: Success message with project creation details  
**What it validates**:
- Project directory creation
- SQLite database initialization
- Metadata file generation
- LightRAG directory setup

---

### **Test 5: Template-Based Project Creation**
```bash
# Tests: Template system and rich sample data population
curl -X POST http://127.0.0.1:8000/templates/projects/from-template \
  -H 'Content-Type: application/json' \
  -d '{
    "template": "screenplay", 
    "name": "my_movie",
    "description": "Screenplay project with sample data",
    "include_sample_data": true
  }'
```
**Purpose**: Creates project from screenplay template with Alex Rivera & Morgan Chen characters  
**Expected Response**: Detailed creation summary with buckets and tables created  
**What it validates**:
- Template processing logic
- Sample data insertion
- Database table creation
- Bucket directory initialization

---

## 📊 **CSV Upload and Table Management**

### **Test 6: CSV File Creation and Upload**
```bash
# Create sample CSV file with test data
cat > characters.csv << 'EOF'
name,age,role,description
Alice Johnson,28,Protagonist,Determined software engineer
Bob Martinez,32,Mentor,Experienced team lead
Carol Wong,25,Antagonist,Competitive rival developer
EOF

# Tests: CSV upload module and pandas integration
curl -X POST "http://127.0.0.1:8000/projects/test_project/tables/upload_csv?project=test_project&table_name=characters" \
  -F "file=@characters.csv"
```
**Purpose**: Tests CSV processing with pandas, table creation, and data insertion  
**Expected Response**: Success message with rows inserted and column information  
**What it validates**:
- Pandas CSV parsing
- Column name cleaning
- Database table creation
- Data type handling (all TEXT)
- File upload processing

---

### **Test 7: Table Data Retrieval**
```bash
# Tests: Table query functionality and data formatting
curl "http://127.0.0.1:8000/projects/test_project/tables/tables/characters?project=test_project"
```
**Purpose**: Retrieves and displays uploaded CSV data in JSON format  
**Expected Response**: JSON array with character data  
**What it validates**:
- Database query execution
- JSON serialization
- Table existence validation
- Data integrity

---

### **Test 8: Table Schema Information**
```bash
# Tests: Database introspection and metadata
curl "http://127.0.0.1:8000/projects/test_project/tables/tables/characters/schema?project=test_project"
```
**Purpose**: Returns table structure information including columns and row count  
**Expected Response**: Schema details with column definitions  
**What it validates**:
- SQLite PRAGMA queries
- Metadata extraction
- Database health checking

---

## 📄 **Document Upload and AI Processing**

### **Test 9: Document Creation and Bucket Setup**
```bash
# Create research document with meaningful content
cat > character_research.txt << 'EOF'
Character Development Research

Key principles for protagonist development:
1. Clear motivation drives all actions
2. Internal conflict creates relatability  
3. Character growth through challenges
4. Authentic dialogue reveals personality
5. Visual actions show character traits

Alice represents the modern professional struggling with work-life balance.
Bob serves as the wise mentor archetype.
Carol embodies competitive pressure in tech industry.
EOF

# Tests: Bucket creation for document organization
curl -X POST http://127.0.0.1:8000/projects/test_project/buckets/buckets/new \
  -H 'Content-Type: application/json' \
  -d '{"bucket": "character_research"}'
```
**Purpose**: Creates document bucket for AI processing  
**Expected Response**: Bucket creation confirmation  
**What it validates**:
- LightRAG directory creation
- Bucket organization system
- File structure management

---

### **Test 10: Document Upload and LightRAG Processing**
```bash
# Tests: Document ingestion and AI processing pipeline
curl -X POST http://127.0.0.1:8000/projects/test_project/buckets/buckets/character_research/ingest \
  -F "file=@character_research.txt"
```
**Purpose**: Uploads document and triggers LightRAG AI processing  
**Expected Response**: Success with document ID  
**What it validates**:
- File upload handling
- LightRAG entity extraction (should find 2+ entities)
- Relationship mapping (should find 1+ relationships)
- Vector embedding generation (1536-dimensional)
- Knowledge graph construction

**Watch server logs for**:
- `"Chunk 1 of 1 extracted X Ent + Y Rel"`
- `"Document processing pipeline completed"`

---

### **Test 11: Semantic Document Querying**
```bash
# Tests: AI-powered semantic search and content synthesis
curl -X POST http://127.0.0.1:8000/projects/test_project/buckets/buckets/character_research/query \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "character development principles",
    "user_prompt": "What are the key insights about developing compelling protagonists?"
  }'
```
**Purpose**: Queries uploaded document using AI semantic search  
**Expected Response**: Intelligent synthesis of document content (1000+ characters)  
**What it validates**:
- LightRAG query processing
- Vector similarity search
- Content synthesis and generation
- Context-aware responses

---

## 🤖 **AI Content Generation**

### **Test 12: Single-Source AI Writing**
```bash
# Tests: AI writing using table data only
curl -X POST http://127.0.0.1:8000/projects/test_project/write/write \
  -H 'Content-Type: application/json' \
  -d '{
    "project_id": "test_project",
    "prompt_tone": "creative",
    "custom_instructions": "Write character introductions",
    "selected_tables": ["characters"],
    "selected_buckets": [],
    "brainstorm_version_ids": []
  }'
```
**Purpose**: Generates AI content using only CSV table data  
**Expected Response**: Generated content with version tracking  
**What it validates**:
- Table data loading and integration
- AI prompt construction
- Content generation (expect 1500+ characters)
- Version saving with metadata

---

### **Test 13: Multi-Source AI Writing**
```bash
# Tests: Complex AI generation combining multiple data sources
curl -X POST http://127.0.0.1:8000/projects/test_project/write/write \
  -H 'Content-Type: application/json' \
  -d '{
    "project_id": "test_project",
    "prompt_tone": "professional",
    "custom_instructions": "Create a character analysis incorporating research insights",
    "selected_tables": ["characters"],
    "selected_buckets": ["character_research"],
    "brainstorm_version_ids": []
  }'
```
**Purpose**: Tests complex multi-source AI generation combining documents and tables  
**Expected Response**: Rich generated content using both data sources  
**What it validates**:
- Multi-source data integration
- Document + table combination
- Complex prompt building
- Error handling for missing sources

---

### **Test 14: AI Brainstorming**
```bash
# Tests: Creative brainstorming with context awareness
curl -X POST http://127.0.0.1:8000/projects/test_project/brainstorm/brainstorm \
  -H 'Content-Type: application/json' \
  -d '{
    "project_id": "test_project",
    "scene_id": "character_introduction",
    "scene_description": "Alice meets Bob for the first time in the office",
    "selected_buckets": ["character_research"],
    "custom_prompt": "Focus on realistic workplace dynamics and character chemistry",
    "tone": "professional",
    "easter_egg": "subtle tech industry references"
  }'
```
**Purpose**: Tests AI brainstorming with creative prompt construction  
**Expected Response**: Creative scene suggestions with version tracking  
**What it validates**:
- Brainstorming logic integration
- Creative prompt processing
- Context-aware idea generation
- Version management system

---

## 📤 **Export and Data Management**

### **Test 15: JSON Project Export**
```bash
# Tests: Complete project data export in JSON format
curl http://127.0.0.1:8000/projects/test_project/export/export/json \
  --output project_export.json
```
**Purpose**: Exports all project data as downloadable JSON  
**Expected Response**: Complete project data file (expect 5KB+ file)  
**What it validates**:
- Data collection across all sources
- JSON serialization
- File download headers
- Export completeness

---

### **Test 16: CSV Table Export**
```bash
# Tests: Table-specific export functionality
curl http://127.0.0.1:8000/projects/test_project/export/export/csv \
  --output tables_export.zip
```
**Purpose**: Exports all project tables as CSV files in ZIP bundle  
**Expected Response**: ZIP file with CSV files  
**What it validates**:
- Table data extraction
- CSV formatting
- ZIP file creation
- Multi-file bundling

---

### **Test 17: Complete Project Export**
```bash
# Tests: Comprehensive export including all data types
curl http://127.0.0.1:8000/projects/test_project/export/export/complete \
  --output complete_export.zip
```
**Purpose**: Creates comprehensive ZIP with tables, documents, versions, and metadata  
**Expected Response**: Large ZIP file with all project components  
**What it validates**:
- Complete data collection
- Multi-format export
- Archive creation
- Data portability

---

## 🔧 **Advanced Template Testing**

### **Test 18: Business Plan Template**
```bash
# Tests: Business-focused template with sample data
curl -X POST http://127.0.0.1:8000/templates/projects/from-template \
  -H 'Content-Type: application/json' \
  -d '{
    "template": "business_plan",
    "name": "startup_venture",
    "description": "Tech startup business plan",
    "include_sample_data": true
  }'
```
**Purpose**: Tests business template with market segments and competitor tables  
**Expected Response**: Project with business-specific tables and sample data  
**What it validates**:
- Business template structure
- Sample market data
- Professional table schemas
- Business-specific buckets

---

### **Test 19: Academic Template**
```bash
# Tests: Academic research template with citation management
curl -X POST http://127.0.0.1:8000/templates/projects/from-template \
  -H 'Content-Type: application/json' \
  -d '{
    "template": "academic_textbook",
    "name": "research_book",
    "description": "Academic textbook project",
    "include_sample_data": true
  }'
```
**Purpose**: Tests academic template with chapters, references, and figures tables  
**Expected Response**: Project with academic structure and sample content  
**What it validates**:
- Academic template complexity
- Reference management
- Chapter organization
- Educational content structure

---

## ⚠️ **Error Handling and Edge Cases**

### **Test 20: Invalid Project Access**
```bash
# Tests: Error handling for non-existent projects
curl http://127.0.0.1:8000/projects/projects/nonexistent_project
```
**Purpose**: Validates proper 404 error handling  
**Expected Response**: 404 error with descriptive message  
**What it validates**: Error handling and response formatting

---

### **Test 21: Invalid Template Request**
```bash
# Tests: Template validation and error responses
curl -X POST http://127.0.0.1:8000/templates/projects/from-template \
  -H 'Content-Type: application/json' \
  -d '{"template": "invalid_template", "name": "error_test"}'
```
**Purpose**: Tests template validation logic  
**Expected Response**: 404 error for invalid template  
**What it validates**: Input validation and error handling

---

### **Test 22: Malformed CSV Upload**
```bash
# Create intentionally problematic CSV
echo "name,age,
Alice,28,extra_field
Bob,invalid_age" > bad_data.csv

# Tests: CSV error handling and data validation
curl -X POST "http://127.0.0.1:8000/projects/test_project/tables/upload_csv?project=test_project&table_name=bad_table" \
  -F "file=@bad_data.csv"
```
**Purpose**: Tests CSV parsing error handling  
**Expected Response**: Should handle gracefully or return validation errors  
**What it validates**: Pandas error handling and data cleaning

---

## 🏥 **System Health Monitoring**

### **Test 23: System Health Check**
```bash
# Tests: Overall system health and component status
curl http://127.0.0.1:8000/system/health
```
**Purpose**: Comprehensive system health monitoring  
**Expected Response**: Health status for all system components  
**What it validates**:
- Database connectivity
- Project directory access
- Component health status

---

### **Test 24: Template System Health**
```bash
# Tests: Template system validation and integrity
curl http://127.0.0.1:8000/templates/health
```
**Purpose**: Validates template system integrity  
**Expected Response**: Template validation results  
**What it validates**:
- Template structure validation
- Sample data integrity
- Template availability

---

### **Test 25: Project-Specific Health**
```bash
# Tests: Individual project health and auto-repair
curl http://127.0.0.1:8000/projects/test_project/health
```
**Purpose**: Project-level health assessment and auto-repair  
**Expected Response**: Detailed project health report  
**What it validates**:
- Database file integrity
- Missing component detection
- Auto-repair functionality

---

## 🧹 **Cleanup and Validation**

### **Test 26: File Cleanup**
```bash
# Remove test files created during testing
rm -f characters.csv character_research.txt bad_data.csv
rm -f project_export.json tables_export.zip complete_export.zip

echo "✅ Test files cleaned up"
```
**Purpose**: Removes temporary files created during testing  

### **Test 27: Verify Export Files**
```bash
# Check that export files were created successfully
ls -la *.json *.zip 2>/dev/null | head -5
echo "Export files size and creation verification"
```
**Purpose**: Validates that export functionality created proper files  

---

## 📊 **Success Criteria and Validation**

### **All Tests Passing Indicates:**
- ✅ **Core Imports**: All Python modules loading successfully
- ✅ **Database Operations**: SQLite CRUD operations working
- ✅ **File Processing**: CSV and document upload functional  
- ✅ **AI Integration**: LightRAG processing and OpenAI generation working
- ✅ **Template System**: All 6 templates creating proper project structures
- ✅ **Export System**: Multiple export formats generating correctly
- ✅ **Error Handling**: Graceful failure responses for invalid inputs
- ✅ **Auto-Repair**: Missing components automatically restored

### **Performance Expectations:**
- Health checks: < 100ms response
- Project creation: < 1 second
- CSV upload: < 2 seconds for small files
- Document processing: 5-15 seconds (depends on content)
- AI generation: 5-20 seconds (depends on complexity)
- Export generation: < 5 seconds for most projects

### **Quality Indicators:**
- No 500 Internal Server errors
- Proper HTTP status codes (200, 404, 400)
- Meaningful error messages
- Complete JSON responses
- Generated content > 1000 characters for AI operations

---

## 🚀 **Ready for Frontend Development**

If all tests pass, your Nell Beta backend is **production-ready** and validates:
- Complete API functionality
- Robust error handling  
- AI-powered document processing
- Multi-source content generation
- Professional template system
- Comprehensive export capabilities

**Next step**: Frontend development with complete confidence in backend stability!
