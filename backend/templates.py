# backend/api/templates.py (NEW)

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
import os
import sqlite3
import json
from datetime import datetime

router = APIRouter()

PROJECTS_DIR = "projects"

# Template definitions
TEMPLATES = {
    "screenplay": {
        "name": "Screenplay Writing",
        "description": "Full screenplay development with character arcs and scene structure",
        "category": "creative",
        "default_buckets": ["character_research", "plot_devices", "dialogue_samples"],
        "default_tables": {
            "characters": {
                "columns": ["name", "age", "role", "arc", "traits", "flaws", "backstory"],
                "description": "Main and supporting characters with development arcs"
            },
            "scenes": {
                "columns": ["act", "scene", "location", "characters", "purpose", "conflict", "outcome"],
                "description": "Scene-by-scene breakdown with structure and purpose"
            },
            "themes": {
                "columns": ["theme", "examples", "character_connection", "scenes", "development"],
                "description": "Central themes and how they develop throughout the story"
            },
            "locations": {
                "columns": ["name", "description", "mood", "scenes_used", "significance"],
                "description": "Key locations and their dramatic significance"
            }
        },
        "sample_data": {
            "characters": [
                {
                    "name": "Alex Rivera", 
                    "age": "28", 
                    "role": "Protagonist", 
                    "arc": "Learns to trust others and overcome isolation", 
                    "traits": "Witty, intelligent, guarded", 
                    "flaws": "Commitment issues, overthinks everything",
                    "backstory": "Former tech prodigy burned by corporate betrayal"
                },
                {
                    "name": "Morgan Chen",
                    "age": "32",
                    "role": "Love Interest",
                    "arc": "Helps Alex open up while pursuing own dreams",
                    "traits": "Patient, creative, determined",
                    "flaws": "Sometimes too accommodating",
                    "backstory": "Independent filmmaker struggling to break through"
                }
            ],
            "scenes": [
                {
                    "act": "1",
                    "scene": "1",
                    "location": "Alex's apartment",
                    "characters": "Alex",
                    "purpose": "Establish character isolation and routine",
                    "conflict": "Internal - resistance to change",
                    "outcome": "Forced to leave comfort zone"
                }
            ],
            "themes": [
                {
                    "theme": "Connection vs. Isolation",
                    "examples": "Alex's hermit lifestyle, Morgan's collaborative nature",
                    "character_connection": "Alex must learn to connect",
                    "scenes": "Opening isolation, meet-cute, final collaboration",
                    "development": "From complete isolation to meaningful partnership"
                }
            ]
        }
    },
    
    "academic_textbook": {
        "name": "Academic Textbook",
        "description": "Research-driven academic writing with citations and structured chapters",
        "category": "academic",
        "default_buckets": ["primary_sources", "secondary_research", "case_studies", "methodologies"],
        "default_tables": {
            "chapters": {
                "columns": ["number", "title", "learning_objectives", "key_concepts", "status", "word_count"],
                "description": "Chapter organization with learning goals and progress tracking"
            },
            "references": {
                "columns": ["author", "title", "year", "type", "relevance", "chapter_usage", "citation_key"],
                "description": "Bibliography and source management with usage tracking"
            },
            "figures": {
                "columns": ["number", "caption", "source", "chapter", "type", "description"],
                "description": "Visual elements and their integration with text"
            },
            "key_terms": {
                "columns": ["term", "definition", "chapter_introduced", "related_concepts", "examples"],
                "description": "Glossary development and concept relationships"
            }
        },
        "sample_data": {
            "chapters": [
                {
                    "number": "1",
                    "title": "Introduction to Film Theory",
                    "learning_objectives": "Define key theoretical frameworks, understand historical context",
                    "key_concepts": "Auteur theory, formalism, realism",
                    "status": "draft",
                    "word_count": "2500"
                },
                {
                    "number": "2",
                    "title": "Classical Hollywood Cinema",
                    "learning_objectives": "Analyze narrative structure, identify visual conventions",
                    "key_concepts": "Three-act structure, continuity editing, star system",
                    "status": "outline",
                    "word_count": "0"
                }
            ],
            "references": [
                {
                    "author": "Bordwell, David",
                    "title": "Narration in the Fiction Film",
                    "year": "1985",
                    "type": "book",
                    "relevance": "foundational theory",
                    "chapter_usage": "1, 3, 5",
                    "citation_key": "bordwell1985"
                }
            ]
        }
    },
    
    "business_plan": {
        "name": "Business Plan",
        "description": "Comprehensive business strategy and market analysis",
        "category": "business",
        "default_buckets": ["market_research", "competitor_analysis", "financial_models", "legal_documents"],
        "default_tables": {
            "market_segments": {
                "columns": ["segment", "size", "growth_rate", "needs", "competition", "opportunity"],
                "description": "Target market analysis and opportunity assessment"
            },
            "competitors": {
                "columns": ["name", "strengths", "weaknesses", "market_share", "strategy", "threat_level"],
                "description": "Competitive landscape and positioning analysis"
            },
            "milestones": {
                "columns": ["milestone", "deadline", "success_criteria", "dependencies", "status", "owner"],
                "description": "Key business objectives and timeline tracking"
            },
            "financial_projections": {
                "columns": ["period", "revenue", "expenses", "profit", "cash_flow", "assumptions"],
                "description": "Financial forecasting and performance metrics"
            }
        },
        "sample_data": {
            "market_segments": [
                {
                    "segment": "Small Business Software",
                    "size": "$50B",
                    "growth_rate": "15% annually",
                    "needs": "Cost-effective automation, easy integration",
                    "competition": "High - many established players",
                    "opportunity": "Underserved niche in creative industries"
                }
            ],
            "milestones": [
                {
                    "milestone": "MVP Development",
                    "deadline": "Q2 2025",
                    "success_criteria": "Core features functional, 10 beta users",
                    "dependencies": "Technical team hiring",
                    "status": "in_progress",
                    "owner": "CTO"
                }
            ]
        }
    },
    
    "research_project": {
        "name": "Research Project",
        "description": "Academic or scientific research with methodology and findings",
        "category": "research",
        "default_buckets": ["literature_review", "methodology", "data_collection", "analysis_results"],
        "default_tables": {
            "research_questions": {
                "columns": ["question", "hypothesis", "methodology", "status", "findings", "significance"],
                "description": "Core research questions and investigation progress"
            },
            "participants": {
                "columns": ["id", "demographics", "group", "consent_date", "status", "notes"],
                "description": "Study participant management and tracking"
            },
            "data_sources": {
                "columns": ["source", "type", "collection_date", "quality", "relevance", "analysis_status"],
                "description": "Data collection tracking and quality assessment"
            },
            "findings": {
                "columns": ["finding", "evidence", "significance", "related_questions", "implications"],
                "description": "Research discoveries and their implications"
            }
        },
        "sample_data": {
            "research_questions": [
                {
                    "question": "How does AI-assisted writing affect creative process?",
                    "hypothesis": "AI tools enhance ideation but may reduce originality",
                    "methodology": "Mixed methods: surveys + interviews",
                    "status": "data_collection",
                    "findings": "Preliminary - increased productivity observed",
                    "significance": "High - impacts creative industries"
                }
            ]
        }
    },
    
    "custom": {
        "name": "Custom Project",
        "description": "Start with a blank slate and build your own structure",
        "category": "general",
        "default_buckets": [],
        "default_tables": {},
        "sample_data": {}
    }
}

@router.get("/templates")
async def list_templates():
    """Get all available project templates with categories"""
    templates_summary = {}
    
    for template_id, template in TEMPLATES.items():
        templates_summary[template_id] = {
            "name": template["name"],
            "description": template["description"],
            "category": template["category"],
            "bucket_count": len(template["default_buckets"]),
            "table_count": len(template["default_tables"]),
            "has_sample_data": len(template.get("sample_data", {})) > 0
        }
    
    return {
        "templates": templates_summary,
        "categories": list(set(t["category"] for t in TEMPLATES.values()))
    }

@router.get("/templates/{template_id}")
async def get_template_details(template_id: str):
    """Get detailed template information"""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = TEMPLATES[template_id].copy()
    
    # Add preview of what will be created
    template["preview"] = {
        "buckets_to_create": template["default_buckets"],
        "tables_to_create": list(template["default_tables"].keys()),
        "sample_rows": sum(len(data) for data in template.get("sample_data", {}).values())
    }
    
    return template

@router.post("/projects/from-template")
async def create_from_template(template_data: dict):
    """Create a new project from template"""
    template_id = template_data.get("template")
    project_name = template_data.get("name")
    description = template_data.get("description", "")
    include_sample_data = template_data.get("include_sample_data", True)
    
    if not template_id or not project_name:
        raise HTTPException(status_code=400, detail="Template and project name required")
    
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Validate project name
    if not project_name.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Project name must be alphanumeric (underscores and hyphens allowed)")
    
    template = TEMPLATES[template_id]
    
    try:
        # Create project directory
        project_path = os.path.join(PROJECTS_DIR, project_name)
        if os.path.exists(project_path):
            raise HTTPException(status_code=400, detail="Project already exists")
        
        os.makedirs(project_path, exist_ok=True)
        
        # Create database
        db_path = os.path.join(project_path, "project.db")
        conn = sqlite3.connect(db_path)
        
        tables_created = []
        rows_inserted = 0
        
        # Create default tables
        for table_name, table_config in template["default_tables"].items():
            columns = table_config["columns"]
            
            # Create table
            column_defs = ", ".join([f'"{col}" TEXT' for col in columns])
            conn.execute(f'CREATE TABLE "{table_name}" ({column_defs})')
            tables_created.append(table_name)
            
            # Insert sample data if available and requested
            if include_sample_data and table_name in template.get("sample_data", {}):
                sample_rows = template["sample_data"][table_name]
                for row in sample_rows:
                    values = [row.get(col, "") for col in columns]
                    placeholders = ", ".join(["?" for _ in columns])
                    conn.execute(f'INSERT INTO "{table_name}" VALUES ({placeholders})', values)
                    rows_inserted += 1
        
        conn.commit()
        conn.close()
        
        # Create LightRAG directories for default buckets
        buckets_created = []
        for bucket in template["default_buckets"]:
            bucket_path = os.path.join(project_path, "lightrag", bucket)
            os.makedirs(bucket_path, exist_ok=True)
            buckets_created.append(bucket)
        
        # Save project metadata
        metadata = {
            "name": project_name,
            "original_name": template_data.get("original_name", project_name),
            "description": description,
            "template": template_id,
            "template_name": template["name"],
            "category": template["category"],
            "created": datetime.now().isoformat(),
            "updated": datetime.now().isoformat(),
            "buckets": buckets_created,
            "tables": tables_created,
            "include_sample_data": include_sample_data,
            "version": "1.0"
        }
        
        with open(os.path.join(project_path, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=2)
        
        return {
            "status": "success",
            "project_name": project_name,
            "template_used": template_id,
            "template_name": template["name"],
            "summary": {
                "buckets_created": len(buckets_created),
                "tables_created": len(tables_created),
                "sample_rows_inserted": rows_inserted
            },
            "details": {
                "buckets": buckets_created,
                "tables": tables_created,
                "project_path": project_path
            }
        }
        
    except sqlite3.Error as e:
        # Clean up on database error
        if os.path.exists(project_path):
            import shutil
            shutil.rmtree(project_path)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        # Clean up on any error
        if os.path.exists(project_path):
            import shutil
            shutil.rmtree(project_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates/{template_id}/preview")
async def preview_template(template_id: str):
    """Preview what will be created from a template without actually creating it"""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = TEMPLATES[template_id]
    
    preview = {
        "template_info": {
            "name": template["name"],
            "description": template["description"],
            "category": template["category"]
        },
        "structure": {
            "buckets": [
                {"name": bucket, "purpose": f"Document storage for {bucket.replace('_', ' ')}"} 
                for bucket in template["default_buckets"]
            ],
            "tables": [
                {
                    "name": table_name,
                    "description": table_config.get("description", ""),
                    "columns": table_config["columns"],
                    "sample_rows": len(template.get("sample_data", {}).get(table_name, []))
                }
                for table_name, table_config in template["default_tables"].items()
            ]
        },
        "sample_data_preview": {
            table_name: data[:2]  # Show first 2 rows of sample data
            for table_name, data in template.get("sample_data", {}).items()
            if data
        }
    }
    
    return preview
