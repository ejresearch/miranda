# backend/api/academic/chapter_generator.py
import os
import sqlite3
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import your existing systems
from backend.core.lightrag_interface import query_bucket, list_buckets
from backend.api.writing.logic import generate_written_output
from backend.api.project_versions import save_version_to_db

class AcademicChapterGenerator:
    """
    Academic Chapter Generator that integrates with your existing Nell Beta infrastructure:
    - Uses your backend/core/lightrag_interface.py for bucket queries
    - Uses your backend/api/writing/logic.py for AI content generation
    - Uses your projects/{name}/project.db structure
    - Uses your backend/api/project_versions.py for version tracking
    """
    
    def __init__(self, project_name: str):
        self.project_name = project_name
        self.project_path = f"projects/{project_name}"
        self.db_path = f"{self.project_path}/project.db"
        self.lightrag_path = f"{self.project_path}/lightrag"
        
    def validate_project(self):
        """Validate project exists and has required structure"""
        if not os.path.exists(self.project_path):
            raise FileNotFoundError(f"Project directory not found: {self.project_path}")
        
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Project database not found: {self.db_path}")
        
        print(f"[ACADEMIC] ✅ Project validated: {self.project_name}")
    
    async def generate_complete_chapter(self, chapter_num: int = 1) -> Dict[str, Any]:
        """
        Generate complete academic chapter using your existing infrastructure
        """
        self.validate_project()
        
        # Create output tables using your database structure
        self._setup_academic_tables()
        
        # Define Chapter 1 sections
        sections = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]
        
        # Track generation progress
        generation_log = []
        total_words = 0
        
        print(f"🎬 Generating Chapter {chapter_num}: The Birth of an Industry")
        print(f"📁 Project: {self.project_name}")
        print(f"🗄️ Database: {self.db_path}")
        print("=" * 60)
        
        # Generate each section using your existing writing system
        for i, roman_numeral in enumerate(sections, 1):
            section_title = self._get_section_title(roman_numeral)
            print(f"\n📝 [{i}/{len(sections)}] Generating Section {roman_numeral}: {section_title}")
            
            try:
                # Build section-specific write request using your existing structure
                write_request = await self._build_write_request(chapter_num, roman_numeral)
                
                # Use your existing generate_written_output function
                print(f"[ACADEMIC] Calling your existing writing system...")
                result = await generate_written_output(**write_request)
                
                if result.get("status") == "success":
                    section_content = result.get("result", "")
                    
                    # Save section using your database structure
                    section_data = self._save_section(
                        chapter_num, 
                        self._roman_to_number(roman_numeral),
                        section_title,
                        section_content,
                        self._get_expected_summary(roman_numeral),
                        result.get("version_id")
                    )
                    
                    generation_log.append(section_data)
                    total_words += section_data["word_count"]
                    
                    print(f"✅ Section {roman_numeral} completed ({section_data['word_count']:,} words)")
                    print(f"📝 {self._get_expected_summary(roman_numeral)}")
                    
                else:
                    # Handle generation error
                    error_msg = result.get("error", "Unknown error")
                    print(f"❌ Section {roman_numeral} failed: {error_msg}")
                    generation_log.append({
                        "section": roman_numeral,
                        "status": "error",
                        "error": error_msg
                    })
                    
            except Exception as e:
                error_msg = f"Failed to generate Section {roman_numeral}: {str(e)}"
                print(f"❌ {error_msg}")
                generation_log.append({
                    "section": roman_numeral,
                    "status": "error", 
                    "error": str(e)
                })
                continue
            
            print("-" * 40)
        
        # Assemble complete chapter
        complete_chapter = self._assemble_complete_chapter(chapter_num)
        
        # Save complete chapter using your version system
        chapter_metadata = self._save_complete_chapter(chapter_num, complete_chapter, len(sections))
        
        print(f"\n🎉 Chapter {chapter_num} Generation Complete!")
        print(f"📊 Total: {len([log for log in generation_log if log.get('status') != 'error'])} sections, {total_words:,} words")
        print(f"💾 Saved to: {self.db_path}")
        
        return {
            "status": "success",
            "project_name": self.project_name,
            "chapter_number": chapter_num,
            "chapter_title": "The Birth of an Industry",
            "content": complete_chapter,
            "metadata": {
                "total_words": total_words,
                "sections_generated": len([log for log in generation_log if log.get("status") != "error"]),
                "sections_failed": len([log for log in generation_log if log.get("status") == "error"]),
                "average_words_per_section": total_words // len(sections) if sections else 0,
                "project_path": self.project_path,
                "database_path": self.db_path
            },
            "sections": generation_log,
            "generation_timestamp": datetime.now().isoformat()
        }
    
    async def _build_write_request(self, chapter_num: int, roman_numeral: str) -> Dict[str, Any]:
        """
        Build write request compatible with your existing backend/api/writing/logic.py
        """
        
        # Build comprehensive academic prompt
        section_data = self._get_section_details(roman_numeral)
        template_data = self._get_section_template(roman_numeral)
        evidence_req = self._get_evidence_requirements(roman_numeral)
        
        # Create comprehensive academic instructions
        academic_instructions = f"""
ACADEMIC TEXTBOOK SECTION: {section_data['title']}

WRITING OBJECTIVE:
{section_data['main_argument']}

TARGET LENGTH: {section_data['estimated_words']} words

WRITING APPROACH:
{template_data['prompt_template']}

TONE: {template_data['tone_instructions']}

SECTION OUTLINE:
{section_data['outline']}

EVIDENCE REQUIREMENTS:
{evidence_req['required_evidence']}

SOURCE SYNTHESIS APPROACH:
{evidence_req['comprehensive_query']}

ACADEMIC STANDARDS:
- Use proper Chicago citation style for film history
- Include specific dates, names, and technical details
- Balance primary and secondary sources  
- Maintain scholarly tone while remaining accessible to undergraduates
- Create smooth transitions that connect to previous and next sections

FLOW REQUIREMENTS:
Builds on: {section_data['builds_on_previous']}
Sets up: {section_data['sets_up_next']}
Transition strategy: {section_data['transition_notes']}

Write Section {roman_numeral} as a complete, standalone section that flows naturally from previous content and sets up the next section. Include proper academic citations, historical evidence, and analysis.
"""
        
        # Get relevant buckets and tables using your existing structure
        relevant_buckets = self._get_relevant_buckets(roman_numeral)
        relevant_tables = self._get_relevant_tables(roman_numeral)
        
        print(f"[ACADEMIC] Section {roman_numeral} will use:")
        print(f"  - Buckets: {relevant_buckets}")
        print(f"  - Tables: {relevant_tables}")
        print(f"  - Instructions: {len(academic_instructions)} chars")
        
        # Return request compatible with your existing writing system
        return {
            "project_id": self.project_name,
            "prompt_tone": "academic",
            "custom_instructions": academic_instructions,
            "selected_buckets": relevant_buckets,
            "selected_tables": relevant_tables,
            "brainstorm_version_ids": []  # Could add brainstorm integration later
        }
    
    def _setup_academic_tables(self):
        """Create academic output tables in your project database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Academic sections table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS academic_sections (
                chapter_number INTEGER,
                section_number INTEGER,
                section_title TEXT,
                full_content TEXT,
                brief_summary TEXT,
                word_count INTEGER,
                version_id TEXT,
                generated_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (chapter_number, section_number)
            )
        """)
        
        # Academic chapters table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS academic_chapters (
                chapter_number INTEGER PRIMARY KEY,
                chapter_title TEXT,
                full_content TEXT,
                total_sections INTEGER,
                total_word_count INTEGER,
                version_id TEXT,
                generated_timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
        print(f"[ACADEMIC] Academic tables initialized in {self.db_path}")
    
    def _save_section(self, chapter_num: int, section_num: int, title: str, 
                     content: str, summary: str, version_id: str = None) -> Dict[str, Any]:
        """Save generated section to your database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        word_count = len(content.split())
        
        cursor.execute("""
            INSERT OR REPLACE INTO academic_sections 
            (chapter_number, section_number, section_title, full_content, brief_summary, word_count, version_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (chapter_num, section_num, title, content, summary, word_count, version_id))
        
        conn.commit()
        conn.close()
        
        return {
            "section": self._number_to_roman(section_num),
            "section_number": section_num,
            "title": title,
            "word_count": word_count,
            "summary": summary,
            "version_id": version_id,
            "status": "completed"
        }
    
    def _assemble_complete_chapter(self, chapter_num: int) -> str:
        """Assemble complete chapter from sections"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT section_number, section_title, full_content 
            FROM academic_sections 
            WHERE chapter_number = ? 
            ORDER BY section_number
        """, (chapter_num,))
        
        all_sections = cursor.fetchall()
        conn.close()
        
        if not all_sections:
            return "No sections generated for this chapter."
        
        # Create properly formatted academic chapter
        chapter_header = f"""# Chapter {chapter_num}: The Birth of an Industry
## American Cinema from Invention to Hollywood's Rise (1890s–1915)

"""
        
        sections_content = []
        for section_num, section_title, content in all_sections:
            roman = self._number_to_roman(section_num)
            sections_content.append(f"## {roman}. {section_title}\n\n{content}")
        
        complete_chapter = chapter_header + "\n\n".join(sections_content)
        return complete_chapter
    
    def _save_complete_chapter(self, chapter_num: int, content: str, section_count: int) -> Dict[str, Any]:
        """Save complete chapter using your version system"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        total_words = len(content.split())
        version_id = f"academic_chapter_{chapter_num}_{int(datetime.now().timestamp())}"
        
        # Save to academic_chapters table
        cursor.execute("""
            INSERT OR REPLACE INTO academic_chapters 
            (chapter_number, chapter_title, full_content, total_sections, total_word_count, version_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (chapter_num, "The Birth of an Industry", content, section_count, total_words, version_id))
        
        conn.commit()
        conn.close()
        
        # Also save as a version using your existing version system
        try:
            save_version_to_db(
                project_id=self.project_name,
                version_id=version_id,
                version_type="academic_chapter",
                name=f"Chapter {chapter_num}: The Birth of an Industry",
                focus=f"Complete academic chapter with {section_count} sections",
                prompt="Academic textbook chapter generation",
                result=content,
                metadata_json={
                    "chapter_number": chapter_num,
                    "total_sections": section_count,
                    "total_words": total_words,
                    "generation_type": "academic_chapter"
                }
            )
            print(f"[ACADEMIC] Saved chapter as version: {version_id}")
        except Exception as e:
            print(f"[WARNING] Failed to save chapter version: {e}")
        
        return {
            "chapter_number": chapter_num,
            "total_words": total_words,
            "sections": section_count,
            "version_id": version_id
        }
    
    def _get_relevant_buckets(self, roman_numeral: str) -> List[str]:
        """Get relevant buckets for each section based on your existing structure"""
        # This maps to your actual bucket structure in projects/textbook_pilot/lightrag/
        bucket_mapping = {
            "I": ["cook_sources", "reference_sources"],
            "II": ["cook_sources", "bordwell_sources", "reference_sources"],
            "III": ["cultural_sources", "cook_sources", "reference_sources"],
            "IV": ["cook_sources", "bordwell_sources"],
            "V": ["balio_sources", "cultural_sources", "cook_sources"],
            "VI": ["balio_sources", "cook_sources", "reference_sources"],
            "VII": ["balio_sources", "cook_sources", "cultural_sources"],
            "VIII": ["balio_sources", "cook_sources", "reference_sources"]
        }
        return bucket_mapping.get(roman_numeral, ["cook_sources", "reference_sources"])
    
    def _get_relevant_tables(self, roman_numeral: str) -> List[str]:
        """Get relevant SQL tables based on your existing structure"""
        # Check what tables actually exist in your textbook_pilot project
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            existing_tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            # Filter for film history tables that exist
            relevant_tables = []
            for table in existing_tables:
                if any(keyword in table.lower() for keyword in ['film_history', 'markdown_outline', 'revision_checklist']):
                    relevant_tables.append(table)
            
            return relevant_tables
            
        except Exception as e:
            print(f"[WARNING] Could not check existing tables: {e}")
            return []
    
    # Helper methods for section data (your established academic structure)
    def _get_section_title(self, roman_numeral: str) -> str:
        titles = {
            "I": "Introduction: The Scientific Dream of Living Pictures",
            "II": "The Race to Invent: Competing Models of Cinema", 
            "III": "Early Content: From Actuality to Narrative Stirrings",
            "IV": "The Dawn of American Narrative: Edwin S. Porter",
            "V": "The Nickelodeon Boom and the New Mass Audience",
            "VI": "Industrialization and Monopoly: The Motion Picture Patents Company",
            "VII": "Resistance and Relocation: The Independents and the Rise of Hollywood",
            "VIII": "The Fall of the Trust and the Dawn of a New Era"
        }
        return titles.get(roman_numeral, f"Section {roman_numeral}")
    
    def _get_expected_summary(self, roman_numeral: str) -> str:
        summaries = {
            "I": "Establishes the scientific and experimental origins of motion pictures through Muybridge and Marey, setting technological foundation",
            "II": "Compares Edison's individual Kinetoscope model with Lumière's communal Cinématographe, establishing competing exhibition paradigms", 
            "III": "Traces evolution from actuality films to entertainment, highlighting *The Kiss* controversy and cinema's emerging social impact",
            "IV": "Analyzes Porter's *The Great Train Robbery* as breakthrough in narrative cinema through innovative editing and storytelling",
            "V": "Examines nickelodeon boom creating working-class mass audience and transforming film from novelty to cultural necessity",
            "VI": "Details MPCC formation and monopoly attempt through patent consolidation and vertical integration strategies",
            "VII": "Chronicles independent resistance through California relocation, star system, and innovative business practices",
            "VIII": "Concludes with MPCC dissolution and establishment of Hollywood as legitimate film industry center"
        }
        return summaries.get(roman_numeral, f"Summary for Section {roman_numeral}")
    
    def _get_section_details(self, roman_numeral: str) -> Dict[str, Any]:
        details = {
            "I": {
                "title": "Introduction: The Scientific Dream of Living Pictures",
                "main_argument": "Early cinema emerged from scientific experimentation and the Victorian fascination with motion, establishing the technological foundation for narrative filmmaking",
                "estimated_words": 1200,
                "builds_on_previous": "None - opening section",
                "sets_up_next": "Technological competition between Edison and Lumière",
                "transition_notes": "End with the stage set for commercial competition",
                "outline": "Late 19th-century workshops and laboratories; Scientific fascination with motion; Muybridge motion studies and Marey chronophotography; Foundation for commercialized motion pictures"
            },
            "II": {
                "title": "The Race to Invent: Competing Models of Cinema",
                "main_argument": "Edison's individual viewing model vs. Lumière's communal projection established competing paradigms that shaped early film exhibition",
                "estimated_words": 1500,
                "builds_on_previous": "Scientific experiments from Section I",
                "sets_up_next": "Content development in early films",
                "transition_notes": "Connect technological capabilities to content possibilities",
                "outline": "A. Edison's Kinetoscope: individual viewing device, Black Maria studio. B. Lumière Cinématographe: projection device, public screenings in Paris"
            },
            "III": {
                "title": "Early Content: From Actuality to Narrative Stirrings",
                "main_argument": "Early films evolved from scientific curiosities to entertainment spectacles, with cultural controversies revealing cinema's social impact",
                "estimated_words": 1100,
                "builds_on_previous": "Exhibition models from Section II",
                "sets_up_next": "Porter's narrative innovations",
                "transition_notes": "Show demand for more sophisticated storytelling",
                "outline": "Actuality films and vaudeville integration; *The Kiss* controversy and censorship; Early audience reception and cultural impact"
            }
            # Add other sections as needed
        }
        return details.get(roman_numeral, details["I"])
    
    def _get_section_template(self, roman_numeral: str) -> Dict[str, str]:
        templates = {
            "I": {
                "prompt_template": "Write as an engaging academic introduction that establishes historical context and technological foundations. Use chronological progression and emphasize the scientific/experimental nature of early motion picture development.",
                "tone_instructions": "Scholarly but accessible, with emphasis on wonder and innovation of the period"
            },
            "II": {
                "prompt_template": "Present as a comparative analysis of competing technologies and business models. Structure around the Edison vs. Lumière rivalry while explaining technical innovations clearly.",
                "tone_instructions": "Analytical and comparative, explaining technical concepts for non-technical readers"
            },
            "III": {
                "prompt_template": "Trace the evolution from documentary to narrative forms. Emphasize audience reception and cultural impact of early films.",
                "tone_instructions": "Cultural analysis tone, connecting films to broader social contexts"
            }
        }
        return templates.get(roman_numeral, templates["I"])
    
    def _get_evidence_requirements(self, roman_numeral: str) -> Dict[str, str]:
        requirements = {
            "I": {
                "required_evidence": "Muybridge motion studies (1878-1886), Marey chronophotography, Edison lab notebooks, early patent filings",
                "comprehensive_query": "Synthesize technical innovations with economic motivations and historical context to show how scientific curiosity evolved into commercial potential."
            },
            "II": {
                "required_evidence": "Kinetoscope patent details, Black Maria studio specifications, Lumière screening records from Paris 1895, early film catalogs",
                "comprehensive_query": "Integrate technical analysis with economic implications and historical narrative of early cinema rivalry."
            },
            "III": {
                "required_evidence": "*The Kiss* reception records, vaudeville program listings, early film reviews, audience reaction documentation",
                "comprehensive_query": "Synthesize formal film analysis with exhibition economics and cultural context to show cinema's emerging social impact."
            }
        }
        return requirements.get(roman_numeral, requirements["I"])
    
    def _roman_to_number(self, roman: str) -> int:
        roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
        return roman_map.get(roman, 1)
    
    def _number_to_roman(self, num: int) -> str:
        number_map = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        return number_map.get(num, "I")


# Standalone test function for your textbook_pilot project
async def test_academic_generation():
    """Test the academic chapter generation with your existing textbook_pilot project"""
    project_name = "textbook_pilot"
    
    print(f"🎬 Testing Academic Chapter Generation")
    print(f"📁 Project: {project_name}")
    print("=" * 50)
    
    try:
        generator = AcademicChapterGenerator(project_name)
        result = await generator.generate_complete_chapter(chapter_num=1)
        
        print(f"\n🎉 Generation completed successfully!")
        print(f"📊 Generated {result['metadata']['total_words']:,} words")
        print(f"📝 Sections: {result['metadata']['sections_generated']}/{result['metadata']['sections_generated'] + result['metadata']['sections_failed']}")
        
        # Save to markdown file as well
        output_path = f"projects/{project_name}/Chapter_1_Generated.md"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result['content'])
        print(f"📁 Also saved to: {output_path}")
        
        return result
        
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Test with your existing textbook_pilot project
    import asyncio
    asyncio.run(test_academic_generation())
