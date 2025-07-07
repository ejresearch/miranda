# backend/api/academic/routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import os
import sqlite3
import json

from .chapter_generator import AcademicChapterGenerator

router = APIRouter()

class ChapterGenerationRequest(BaseModel):
    project_name: str
    chapter_number: int = 1
    academic_level: str = "undergraduate"
    force_regenerate: bool = False
    custom_table_mapping: Optional[Dict[str, List[str]]] = None

class SectionRegenerateRequest(BaseModel):
    project_name: str
    chapter_number: int
    section_number: int  # 1-8 for I-VIII

@router.post("/generate-chapter")
async def generate_academic_chapter(request: ChapterGenerationRequest) -> Dict[str, Any]:
    """
    Generate complete academic chapter using section-by-section approach
    Integrates with your existing Nell Beta infrastructure:
    - backend/core/lightrag_interface.py for LightRAG queries
    - backend/api/writing/logic.py for AI content generation  
    - projects/{name}/project.db structure
    - backend/api/project_versions.py for version tracking
    - backend/lightrag_working_dir/ for actual bucket locations
    """
    
    # Validate project exists
    project_path = f"projects/{request.project_name}"
    if not os.path.exists(project_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Project '{request.project_name}' not found"
        )
    
    db_path = f"{project_path}/project.db"
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    # Validate buckets exist
    lightrag_path = "backend/lightrag_working_dir"
    if not os.path.exists(lightrag_path):
        raise HTTPException(
            status_code=404,
            detail=f"LightRAG buckets directory not found: {lightrag_path}"
        )
    
    try:
        # Initialize generator with optional custom table mapping
        generator = AcademicChapterGenerator(
            request.project_name, 
            custom_table_mapping=request.custom_table_mapping
        )
        
        result = await generator.generate_complete_chapter(
            chapter_num=request.chapter_number
        )
        
        # Add API-specific metadata
        result["api_metadata"] = {
            "request_params": request.dict(),
            "project_path": project_path,
            "database_path": db_path,
            "lightrag_path": lightrag_path,
            "endpoint": "/academic/generate-chapter",
            "buckets_used": generator._get_relevant_buckets("I"),  # Sample to show buckets
            "table_mapping": generator.get_current_table_mapping()
        }
        
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Chapter generation failed: {str(e)}"
        )

@router.post("/regenerate-section")
async def regenerate_chapter_section(request: SectionRegenerateRequest) -> Dict[str, Any]:
    """Regenerate a specific section of a chapter"""
    
    project_path = f"projects/{request.project_name}"
    db_path = f"{project_path}/project.db"
    
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    try:
        generator = AcademicChapterGenerator(request.project_name)
        
        # Convert section number to Roman numeral
        roman_numerals = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        roman_numeral = roman_numerals.get(request.section_number)
        
        if not roman_numeral:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid section number: {request.section_number}. Must be 1-8"
            )
        
        # Build section-specific write request
        write_request = await generator._build_write_request(request.chapter_number, roman_numeral)
        
        # Use existing writing system
        from backend.api.writing.logic import generate_written_output
        result = await generate_written_output(**write_request)
        
        if result.get("status") == "success":
            section_content = result.get("result", "")
            section_title = generator._get_section_title(roman_numeral)
            
            # Save regenerated section
            section_data = generator._save_section(
                request.chapter_number,
                request.section_number,
                section_title,
                section_content,
                generator._get_expected_summary(roman_numeral),
                result.get("version_id")
            )
            
            return {
                "status": "success",
                "section_regenerated": roman_numeral,
                "section_data": section_data,
                "project_name": request.project_name,
                "chapter_number": request.chapter_number
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Section regeneration failed: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Section regeneration failed: {str(e)}"
        )

@router.get("/chapter/{chapter_number}/status")
async def get_chapter_status(project_name: str, chapter_number: int) -> Dict[str, Any]:
    """Get detailed status of chapter generation progress"""
    
    project_path = f"projects/{project_name}"
    db_path = f"{project_path}/project.db"
    
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for existing academic sections
        cursor.execute("""
            SELECT section_number, section_title, word_count, generated_timestamp, version_id
            FROM academic_sections 
            WHERE chapter_number = ?
            ORDER BY section_number
        """, (chapter_number,))
        
        sections = cursor.fetchall()
        
        # Check for complete chapter
        cursor.execute("""
            SELECT total_sections, total_word_count, generated_timestamp, version_id
            FROM academic_chapters 
            WHERE chapter_number = ?
        """, (chapter_number,))
        
        chapter_data = cursor.fetchone()
        conn.close()
        
        # Calculate detailed status
        total_sections_expected = 8  # For Chapter 1
        sections_completed = len(sections)
        total_words = sum(row[2] for row in sections) if sections else 0
        
        # Roman numeral mapping
        roman_numerals = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        completed_sections = [roman_numerals[row[0]] for row in sections]
        missing_sections = [roman_numerals[i] for i in range(1, 9) if i not in [row[0] for row in sections]]
        
        status = {
            "project_name": project_name,
            "chapter_number": chapter_number,
            "sections_completed": sections_completed,
            "sections_expected": total_sections_expected,
            "completion_percentage": round((sections_completed / total_sections_expected) * 100, 1),
            "total_words_generated": total_words,
            "status": "not_started" if sections_completed == 0 else 
                     "in_progress" if sections_completed < total_sections_expected else 
                     "completed",
            "completed_sections": completed_sections,
            "missing_sections": missing_sections,
            "sections_detail": [
                {
                    "section_number": row[0],
                    "section_roman": roman_numerals.get(row[0], str(row[0])),
                    "section_title": row[1],
                    "word_count": row[2],
                    "generated_timestamp": row[3],
                    "version_id": row[4]
                } for row in sections
            ],
            "complete_chapter": {
                "exists": chapter_data is not None,
                "total_sections": chapter_data[0] if chapter_data else 0,
                "total_word_count": chapter_data[1] if chapter_data else 0,
                "generated_timestamp": chapter_data[2] if chapter_data else None,
                "version_id": chapter_data[3] if chapter_data else None
            } if chapter_data else None
        }
        
        return status
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Status check failed: {str(e)}"
        )

@router.get("/chapter/{chapter_number}/content")
async def get_chapter_content(project_name: str, chapter_number: int, format: str = "json") -> Dict[str, Any]:
    """Get the generated chapter content in various formats"""
    
    db_path = f"projects/{project_name}/project.db"
    if not os.path.exists(db_path):
        raise HTTPException(
            status_code=404,
            detail=f"Project database not found: {db_path}"
        )
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get complete chapter
        cursor.execute("""
            SELECT chapter_title, full_content, total_sections, total_word_count, generated_timestamp, version_id
            FROM academic_chapters 
            WHERE chapter_number = ?
        """, (chapter_number,))
        
        chapter_data = cursor.fetchone()
        
        if not chapter_data:
            raise HTTPException(
                status_code=404,
                detail=f"Chapter {chapter_number} not found"
            )
        
        # Get individual sections
        cursor.execute("""
            SELECT section_number, section_title, full_content, word_count, generated_timestamp, version_id
            FROM academic_sections 
            WHERE chapter_number = ?
            ORDER BY section_number
        """, (chapter_number,))
        
        sections = cursor.fetchall()
        conn.close()
        
        # Roman numeral mapping
        roman_numerals = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        
        result = {
            "project_name": project_name,
            "chapter_number": chapter_number,
            "chapter_title": chapter_data[0],
            "full_content": chapter_data[1],
            "metadata": {
                "total_sections": chapter_data[2],
                "total_word_count": chapter_data[3],
                "generated_timestamp": chapter_data[4],
                "version_id": chapter_data[5],
                "format": format
            },
            "sections": [
                {
                    "section_number": row[0],
                    "section_roman": roman_numerals.get(row[0], str(row[0])),
                    "section_title": row[1],
                    "content": row[2],
                    "word_count": row[3],
                    "generated_timestamp": row[4],
                    "version_id": row[5]
                } for row in sections
            ]
        }
        
        # Format-specific processing
        if format == "markdown":
            # Save as markdown file
            markdown_path = f"projects/{project_name}/Chapter_{chapter_number}_Export.md"
            with open(markdown_path, 'w', encoding='utf-8') as f:
                f.write(chapter_data[1])
            result["markdown_file"] = markdown_path
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Content retrieval failed: {str(e)}"
        )

@router.get("/projects/{project_name}/validate")
async def validate_project_for_academic_generation(project_name: str) -> Dict[str, Any]:
    """
    Comprehensive validation that project has sufficient resources for academic chapter generation
    Checks LightRAG buckets, SQL tables, and system readiness
    """
    
    project_path = f"projects/{project_name}"
    lightrag_path = "backend/lightrag_working_dir"  # Corrected path
    
    validation_results = {
        "project_name": project_name,
        "project_exists": os.path.exists(project_path),
        "database_exists": os.path.exists(f"{project_path}/project.db"),
        "lightrag_directory_exists": os.path.exists(lightrag_path),
        "buckets_found": [],
        "academic_buckets_found": [],
        "tables_found": [],
        "film_history_tables_found": [],
        "table_mapping_valid": False,
        "ready_for_generation": False,
        "issues": [],
        "recommendations": [],
        "system_info": {
            "project_path": project_path,
            "lightrag_path": lightrag_path,
            "expected_buckets": 10,
            "expected_sections": 8
        }
    }
    
    if not validation_results["project_exists"]:
        validation_results["issues"].append(f"Project directory not found: {project_path}")
        return validation_results
    
    # Check LightRAG buckets in correct location
    if os.path.exists(lightrag_path):
        try:
            all_buckets = [d for d in os.listdir(lightrag_path) 
                          if os.path.isdir(os.path.join(lightrag_path, d))]
            validation_results["buckets_found"] = all_buckets
            
            # Check for your specific academic buckets
            expected_academic_buckets = [
                "balio_sources", "bordwell_sources", "character_research",
                "cook_sources", "cousins_sources", "cultural_sources", 
                "dixon_foster_sources", "gomery_sources", "reference_sources", 
                "knight_sources"
            ]
            
            found_academic_buckets = [b for b in expected_academic_buckets if b in all_buckets]
            validation_results["academic_buckets_found"] = found_academic_buckets
            
            missing_buckets = [b for b in expected_academic_buckets if b not in all_buckets]
            
            if missing_buckets:
                validation_results["issues"].append(f"Missing expected academic buckets: {missing_buckets}")
                validation_results["recommendations"].append(
                    f"Upload source materials to missing buckets: {missing_buckets}"
                )
            else:
                validation_results["recommendations"].append(
                    f"✅ All {len(expected_academic_buckets)} academic buckets found!"
                )
            
            # Check bucket content
            empty_buckets = []
            for bucket in found_academic_buckets:
                bucket_path = os.path.join(lightrag_path, bucket)
                files = os.listdir(bucket_path)
                if len(files) == 0:
                    empty_buckets.append(bucket)
            
            if empty_buckets:
                validation_results["issues"].append(f"Empty buckets found: {empty_buckets}")
                validation_results["recommendations"].append(
                    "Upload documents to empty buckets for better content generation"
                )
            
        except Exception as e:
            validation_results["issues"].append(f"Error reading LightRAG buckets: {e}")
    else:
        validation_results["issues"].append(f"LightRAG directory not found: {lightrag_path}")
    
    # Check database and tables
    db_path = f"{project_path}/project.db"
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            validation_results["tables_found"] = tables
            
            # Check for film history tables
            film_history_tables = [t for t in tables if 'film_history' in t.lower() or 'markdown_outline' in t.lower()]
            validation_results["film_history_tables_found"] = film_history_tables
            
            if film_history_tables:
                validation_results["recommendations"].append(
                    f"✅ Found {len(film_history_tables)} film history tables: {film_history_tables}"
                )
                
                # Validate table mapping
                try:
                    generator = AcademicChapterGenerator(project_name)
                    mapping = generator.get_current_table_mapping()
                    
                    # Check if mapped tables exist
                    all_mapped_tables = set()
                    for section_tables in mapping.values():
                        all_mapped_tables.update(section_tables)
                    
                    missing_mapped_tables = [t for t in all_mapped_tables if t not in tables]
                    
                    if missing_mapped_tables:
                        validation_results["issues"].append(
                            f"Table mapping references non-existent tables: {missing_mapped_tables}"
                        )
                        validation_results["recommendations"].append(
                            "Import missing CSV files or update table mapping configuration"
                        )
                    else:
                        validation_results["table_mapping_valid"] = True
                        validation_results["recommendations"].append(
                            "✅ Table mapping validation passed - all referenced tables exist"
                        )
                        
                except Exception as e:
                    validation_results["issues"].append(f"Table mapping validation failed: {e}")
            else:
                validation_results["recommendations"].append(
                    "📝 Import film history CSV files for optimal academic structure and guidance"
                )
            
            conn.close()
            
        except Exception as e:
            validation_results["issues"].append(f"Error reading database: {e}")
    else:
        validation_results["issues"].append("Project database not found")
    
    # Overall readiness assessment
    validation_results["ready_for_generation"] = (
        validation_results["project_exists"] and
        validation_results["database_exists"] and
        validation_results["lightrag_directory_exists"] and
        len(validation_results["academic_buckets_found"]) >= 8 and  # Most academic buckets
        validation_results["table_mapping_valid"]
    )
    
    if validation_results["ready_for_generation"]:
        validation_results["recommendations"].append(
            "🎯 Project is fully ready for academic chapter generation!"
        )
    else:
        validation_results["recommendations"].append(
            "⚠️ Address the issues above before attempting chapter generation"
        )
    
    return validation_results

@router.get("/projects/{project_name}/buckets")
async def list_project_buckets(project_name: str, academic_only: bool = True) -> Dict[str, Any]:
    """List available LightRAG buckets with content analysis"""
    
    lightrag_path = "backend/lightrag_working_dir"  # Corrected path
    
    if not os.path.exists(lightrag_path):
        raise HTTPException(
            status_code=404,
            detail=f"LightRAG directory not found: {lightrag_path}"
        )
    
    try:
        all_buckets = []
        academic_buckets = [
            "balio_sources", "bordwell_sources", "character_research",
            "cook_sources", "cousins_sources", "cultural_sources", 
            "dixon_foster_sources", "gomery_sources", "reference_sources", 
            "knight_sources"
        ]
        
        for item in os.listdir(lightrag_path):
            bucket_path = os.path.join(lightrag_path, item)
            if os.path.isdir(bucket_path):
                # Analyze bucket content
                files = os.listdir(bucket_path)
                has_content = len(files) > 0
                is_academic = item in academic_buckets
                
                # Check for specific LightRAG files
                lightrag_files = [f for f in files if any(keyword in f for keyword in 
                                 ['kv_store', 'vdb_', 'graph_chunk'])]
                
                bucket_info = {
                    "name": item,
                    "path": bucket_path,
                    "is_academic_bucket": is_academic,
                    "has_content": has_content,
                    "total_files": len(files),
                    "lightrag_files": len(lightrag_files),
                    "ready_for_queries": len(lightrag_files) > 0,
                    "file_types": list(set([f.split('.')[-1] for f in files if '.' in f]))
                }
                
                if not academic_only or is_academic:
                    all_buckets.append(bucket_info)
        
        # Sort academic buckets first, then by name
        all_buckets.sort(key=lambda x: (not x["is_academic_bucket"], x["name"]))
        
        # Summary statistics
        academic_count = len([b for b in all_buckets if b["is_academic_bucket"]])
        ready_count = len([b for b in all_buckets if b["ready_for_queries"]])
        
        return {
            "project_name": project_name,
            "lightrag_path": lightrag_path,
            "buckets": all_buckets,
            "summary": {
                "total_buckets": len(all_buckets),
                "academic_buckets": academic_count,
                "ready_for_queries": ready_count,
                "academic_buckets_ready": len([b for b in all_buckets 
                                             if b["is_academic_bucket"] and b["ready_for_queries"]])
            },
            "filter_applied": "academic_only" if academic_only else "all_buckets"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list buckets: {str(e)}"
        )

@router.get("/projects/{project_name}/table-mapping")
async def get_table_mapping_analysis(project_name: str) -> Dict[str, Any]:
    """Analyze current table assignments and their strategic value for each section"""
    
    try:
        generator = AcademicChapterGenerator(project_name)
        mapping = generator.get_current_table_mapping()
        
        # Verify which tables actually exist
        db_path = f"projects/{project_name}/project.db"
        if not os.path.exists(db_path):
            raise HTTPException(
                status_code=404,
                detail=f"Project database not found: {db_path}"
            )
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        # Analyze mapping validity and strategic purpose
        roman_numerals = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        analysis = {}
        
        for section, tables in mapping.items():
            missing_tables = [t for t in tables if t not in existing_tables]
            existing_assigned = [t for t in tables if t in existing_tables]
            
            # Determine strategic purpose of each table type
            table_purposes = {}
            for table in tables:
                if 'sections' in table.lower():
                    table_purposes[table] = "Section structure and arguments"
                elif 'evidence' in table.lower():
                    table_purposes[table] = "Required evidence and fact-checking"
                elif 'templates' in table.lower():
                    table_purposes[table] = "Writing approach and tone guidance"
                elif 'scaffolding' in table.lower():
                    table_purposes[table] = "Pedagogical context and framework"
                elif 'revision' in table.lower():
                    table_purposes[table] = "Quality control and accuracy standards"
                elif 'outline' in table.lower():
                    table_purposes[table] = "Detailed structural roadmap"
                else:
                    table_purposes[table] = "Supporting data and context"
            
            section_number = None
            for num, roman in roman_numerals.items():
                if roman == section:
                    section_number = num
                    break
            
            analysis[section] = {
                "section_number": section_number,
                "section_title": generator._get_section_title(section) if section_number else "Unknown",
                "assigned_tables": tables,
                "existing_tables": existing_assigned,
                "missing_tables": missing_tables,
                "table_purposes": table_purposes,
                "valid": len(missing_tables) == 0,
                "readiness_score": len(existing_assigned) / len(tables) if tables else 0
            }
        
        # Overall assessment
        overall_valid = all(a["valid"] for a in analysis.values())
        avg_readiness = sum(a["readiness_score"] for a in analysis.values()) / len(analysis)
        
        return {
            "project_name": project_name,
            "table_mapping": mapping,
            "existing_tables": existing_tables,
            "analysis": analysis,
            "summary": {
                "overall_valid": overall_valid,
                "average_readiness_score": round(avg_readiness, 2),
                "total_sections": len(analysis),
                "fully_ready_sections": len([a for a in analysis.values() if a["valid"]]),
                "total_tables_mapped": sum(len(tables) for tables in mapping.values()),
                "total_tables_available": len(existing_tables)
            },
            "recommendations": [
                "✅ Table mapping strategy is well-designed" if overall_valid else "⚠️ Some referenced tables are missing",
                f"📊 {len([a for a in analysis.values() if a['valid']])}/8 sections have all required tables",
                "🎯 Each section gets strategic mix of structure, evidence, and guidance tables" if avg_readiness > 0.8 else "📝 Consider importing missing CSV files"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Table mapping analysis failed: {str(e)}"
        )

@router.get("/projects/{project_name}/generation-config")
async def get_generation_configuration(project_name: str) -> Dict[str, Any]:
    """Get complete configuration for academic chapter generation"""
    
    try:
        generator = AcademicChapterGenerator(project_name)
        
        # Get bucket configuration
        sample_buckets = generator._get_relevant_buckets("I")
        
        # Get table mapping
        table_mapping = generator.get_current_table_mapping()
        
        # Get paradigmatic framework details
        paradigm_sample = {
            "technology_focus": generator._get_tech_paradigm_focus("I"),
            "business_focus": generator._get_business_paradigm_focus("I")
        }
        
        # Section details
        sections_config = {}
        roman_numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]
        
        for roman in roman_numerals:
            section_details = generator._get_section_details(roman)
            template_info = generator._get_section_template(roman)
            evidence_req = generator._get_evidence_requirements(roman)
            
            sections_config[roman] = {
                "title": section_details["title"],
                "main_argument": section_details["main_argument"],
                "estimated_words": section_details["estimated_words"],
                "writing_approach": template_info["prompt_template"],
                "tone": template_info["tone_instructions"],
                "evidence_required": evidence_req["required_evidence"],
                "assigned_tables": table_mapping.get(roman, []),
                "technology_paradigm": generator._get_tech_paradigm_focus(roman),
                "business_paradigm": generator._get_business_paradigm_focus(roman)
            }
        
        return {
            "project_name": project_name,
            "generation_ready": True,
            "paradigmatic_framework": {
                "book_title": "A Paradigmatic Perspective of The History of American Film",
                "central_thesis": "Cinema evolution from scientific curiosity to industrialized art form",
                "dual_lens": "Technology innovation + Business transformation",
                "sample_paradigm": paradigm_sample
            },
            "source_configuration": {
                "buckets_used": sample_buckets,
                "bucket_strategy": "ALL buckets queried for every section",
                "lightrag_path": generator.lightrag_path,
                "total_buckets": len(sample_buckets)
            },
            "table_configuration": {
                "mapping_strategy": "Targeted tables per section based on analytical needs",
                "table_mapping": table_mapping,
                "database_path": generator.db_path
            },
            "sections_configuration": sections_config,
            "generation_parameters": {
                "total_sections": 8,
                "target_total_words": 12000,
                "academic_level": "undergraduate",
                "citation_style": "Chicago",
                "paradigmatic_integration": "Every section applies technology/business dual lens"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Configuration retrieval failed: {str(e)}"
        )

# Integration instructions for backend/main.py
"""
To integrate this academic writing system with your existing backend/main.py:

# Add this import after your existing imports
from backend.api.academic import routes as academic_routes

# Add this router after your existing includes
app.include_router(
    academic_routes.router, 
    prefix="/academic", 
    tags=["Academic Writing"]
)

Available endpoints:
- POST /academic/generate-chapter
- POST /academic/regenerate-section  
- GET /academic/chapter/{chapter_number}/status?project_name=textbook_pilot
- GET /academic/chapter/{chapter_number}/content?project_name=textbook_pilot&format=json
- GET /academic/projects/{project_name}/validate
- GET /academic/projects/{project_name}/buckets?academic_only=true
- GET /academic/projects/{project_name}/table-mapping
- GET /academic/projects/{project_name}/generation-config

Example usage:
curl -X POST http://localhost:8000/academic/generate-chapter \
  -H "Content-Type: application/json" \
  -d '{"project_name": "textbook_pilot", "chapter_number": 1}'
"""
