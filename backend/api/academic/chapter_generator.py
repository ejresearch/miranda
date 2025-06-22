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
    
    CONFIGURATION:
    - ALL BUCKETS: Every section queries ALL available document buckets for comprehensive source access
    - TARGETED TABLES: Each section uses intentionally selected SQL tables for specific data needs
    """
    
    # TABLE CONFIGURATION - Modify these mappings to control which tables each section uses
    SECTION_TABLE_MAPPING = {
        "I": [
            "film_history_sections_week1",      # Core section structure
            "film_history_scaffolding_week1",   # Pedagogical foundation
            "Markdown Outline for SQL  Sheet1"  # Detailed outline
        ],
        "II": [
            "film_history_sections_week1",           # Section details
            "film_history_evidence_week1",           # Required evidence
            "film_history_section_templates_week1"   # Writing approach
        ],
        "III": [
            "film_history_sections_week1", 
            "film_history_evidence_week1",
            "film_history_revision_checklist_week1"  # Quality standards
        ],
        "IV": [
            "film_history_sections_week1",      # Porter analysis
            "film_history_evidence_week1",      # Great Train Robbery data
            "Markdown Outline for SQL  Sheet1"  # Narrative structure
        ],
        "V": [
            "film_history_sections_week1",      # Nickelodeon boom
            "film_history_scaffolding_week1",   # Industry context
            "film_history_evidence_week1"       # Economic/social data
        ],
        "VI": [
            "film_history_sections_week1",           # MPPC analysis
            "film_history_evidence_week1",           # Legal evidence
            "film_history_revision_checklist_week1"  # Fact-checking
        ],
        "VII": [
            "film_history_sections_week1",           # Hollywood rise
            "film_history_section_templates_week1",  # Geographic transformation
            "film_history_evidence_week1"            # Independent evidence
        ],
        "VIII": [
            "film_history_sections_week1",           # Conclusion
            "film_history_scaffolding_week1",        # Future setup
            "film_history_revision_checklist_week1", # Final check
            "Markdown Outline for SQL  Sheet1"       # Chapter synthesis
        ]
    }

    def __init__(self, project_name: str, custom_table_mapping: Dict[str, List[str]] = None):
        self.project_name = project_name
        self.project_path = f"projects/{project_name}"
        self.db_path = f"{self.project_path}/project.db"
        
        # CORRECTED: Your buckets are in backend/lightrag_working_dir/, not project-specific lightrag/
        self.lightrag_path = f"backend/lightrag_working_dir"
        
        # Allow custom table mapping override
        if custom_table_mapping:
            self.SECTION_TABLE_MAPPING.update(custom_table_mapping)
            print(f"[ACADEMIC] Using custom table mapping for {len(custom_table_mapping)} sections")
        
    def set_table_mapping_for_section(self, section: str, tables: List[str]):
        """Dynamically set which tables a specific section should use"""
        self.SECTION_TABLE_MAPPING[section] = tables
        print(f"[ACADEMIC] Updated Section {section} to use tables: {tables}")
    
    def get_current_table_mapping(self) -> Dict[str, List[str]]:
        """Get the current table mapping configuration"""
        return self.SECTION_TABLE_MAPPING.copy()
        
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
        
        # Create comprehensive academic instructions with paradigmatic framework
        academic_instructions = f"""
ACADEMIC TEXTBOOK SECTION: {section_data['title']}

PARADIGMATIC FRAMEWORK - "A Paradigmatic Perspective of The History of American Film":
This chapter operates within a TECHNOLOGY & BUSINESS paradigm that views American cinema evolution through two fundamental lenses:
1. TECHNOLOGICAL INNOVATION: How scientific advances and technical capabilities shaped creative possibilities
2. BUSINESS/INDUSTRIAL TRANSFORMATION: How economic forces, corporate strategies, and market dynamics drove industry development

The entire analysis should demonstrate how cinema evolved "from scientific curiosity to industrialized art form" through the interplay of technological capability and business innovation.

WRITING OBJECTIVE:
{section_data['main_argument']}

PARADIGMATIC INTEGRATION FOR THIS SECTION:
- Technology Dimension: {self._get_tech_paradigm_focus(roman_numeral)}
- Business Dimension: {self._get_business_paradigm_focus(roman_numeral)}

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

DATA SOURCE STRATEGY:
- COMPREHENSIVE DOCUMENT ACCESS: Query ALL document buckets for maximum source diversity and evidence depth
- TARGETED SQL DATA: Use specific tables selected for this section's analytical needs and structural requirements
- PARADIGMATIC ANALYSIS: Frame all evidence through the technology/business lens that defines this textbook's approach

ACADEMIC STANDARDS:
- Use proper Chicago citation style for film history
- Include specific dates, names, and technical details
- Balance primary and secondary sources across ALL available document collections
- Maintain scholarly tone while remaining accessible to undergraduates
- Create smooth transitions that connect to previous and next sections
- Leverage both broad source knowledge and specific structural data
- CONSISTENTLY apply the technology/business paradigmatic framework throughout

FLOW REQUIREMENTS:
Builds on: {section_data['builds_on_previous']}
Sets up: {section_data['sets_up_next']}
Transition strategy: {section_data['transition_notes']}

Write Section {roman_numeral} as a complete, standalone section that flows naturally from previous content and sets up the next section. Draw from ALL available document sources while using targeted table data for structure and specific requirements. Include proper academic citations, historical evidence, and analysis. MOST IMPORTANTLY: Frame all content through the paradigmatic lens of technology and business as the driving forces of American cinema development.
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
        
        # Create properly formatted academic chapter with paradigmatic framing
        chapter_header = f"""# Chapter {chapter_num}: The Birth of an Industry
## American Cinema from Invention to Hollywood's Rise (1890s–1915)

### A Paradigmatic Perspective of The History of American Film

This chapter examines the foundational period of American cinema through the dual lens of **technological innovation** and **business transformation**. Rather than viewing early cinema as a series of isolated developments, this paradigmatic approach reveals how the interplay between scientific advancement and commercial enterprise drove the evolution of motion pictures "from scientific curiosity to industrialized art form."

The technological dimension encompasses the scientific experiments, patent developments, and technical innovations that made cinema possible—from Muybridge's motion studies to Edison's Kinetoscope to the Lumière Cinématographe. The business dimension examines how entrepreneurs, inventors, and financiers transformed these technological capabilities into sustainable commercial enterprises, ultimately creating the industrial foundation for Hollywood's emergence.

This dual paradigm demonstrates that American cinema's development was neither purely artistic nor merely technical, but fundamentally shaped by the dynamic relationship between technological possibility and economic opportunity.

---

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
        """Get ALL academic buckets for comprehensive source access across all sections"""
        # Your specific academic buckets from backend/lightrag_working_dir/
        academic_buckets = [
            "balio_sources", 
            "bordwell_sources",
            "character_research",
            "cook_sources",
            "cousins_sources", 
            "cultural_sources",
            "dixon_foster_sources",
            "gomery_sources",
            "reference_sources",
            "knight_sources"
        ]
        
        try:
            # Verify which buckets actually exist and are accessible
            if os.path.exists(self.lightrag_path):
                existing_buckets = [bucket for bucket in academic_buckets 
                                  if os.path.exists(os.path.join(self.lightrag_path, bucket))]
                
                if existing_buckets:
                    print(f"[ACADEMIC] Using {len(existing_buckets)} existing academic buckets for Section {roman_numeral}")
                    print(f"[ACADEMIC] Buckets: {existing_buckets}")
                    return existing_buckets
                else:
                    print(f"[ACADEMIC] No existing buckets found, using all intended academic buckets for Section {roman_numeral}")
                    return academic_buckets
            else:
                print(f"[ACADEMIC] LightRAG directory not found, using intended academic buckets for Section {roman_numeral}")
                return academic_buckets
                
        except Exception as e:
            print(f"[WARNING] Could not verify buckets: {e}")
            print(f"[ACADEMIC] Using all intended academic buckets for Section {roman_numeral}")
            return academic_buckets
    
    def _get_relevant_tables(self, roman_numeral: str) -> List[str]:
        """Get intentionally selected SQL tables for each section"""
        
        # Use the class-level configuration
        selected_tables = self.SECTION_TABLE_MAPPING.get(roman_numeral, ["film_history_sections_week1"])
        
        # Verify tables exist in database
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            existing_tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            # Filter to only existing tables
            verified_tables = [table for table in selected_tables if table in existing_tables]
            
            if not verified_tables:
                # Fallback to any film history tables if selected ones don't exist
                verified_tables = [table for table in existing_tables 
                                 if any(keyword in table.lower() for keyword in ['film_history', 'markdown_outline'])]
            
            print(f"[ACADEMIC] Section {roman_numeral} using tables: {verified_tables}")
            return verified_tables
            
        except Exception as e:
            print(f"[WARNING] Could not verify tables: {e}")
            return selected_tables  # Return intended tables even if verification fails
    
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
            "IV": "Analyzes Porter's *The Great Train Robbery* as breakthrough in American narrative cinema through innovative editing and storytelling",
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
                "main_argument": "Early cinema emerged from scientific experimentation and Victorian fascination with motion, establishing both the technological foundation and commercial potential for narrative filmmaking through the paradigmatic intersection of laboratory innovation and entrepreneurial investment",
                "estimated_words": 1200,
                "builds_on_previous": "None - opening section that establishes the technology/business paradigmatic framework",
                "sets_up_next": "Technological competition and business model rivalry between Edison and Lumière",
                "transition_notes": "End with the stage set for commercial competition between competing technological and business approaches",
                "outline": "Late 19th-century scientific workshops as sites of commercial potential; Victorian fascination with motion as market opportunity; Muybridge motion studies and Marey chronophotography as technological/business foundation; Laboratory experiments attracting entrepreneurial capital and patent investment"
            },
            "II": {
                "title": "The Race to Invent: Competing Models of Cinema",
                "main_argument": "Edison's individual viewing model versus Lumière's communal projection established competing technological and business paradigms that shaped early film exhibition, demonstrating how technical capabilities and revenue models evolved together",
                "estimated_words": 1500,
                "builds_on_previous": "Scientific/commercial foundation from Section I",
                "sets_up_next": "Content development driven by technological capabilities and business opportunities",
                "transition_notes": "Connect technological capabilities to content possibilities and business implications",
                "outline": "A. Edison's Kinetoscope: individual viewing technology and arcade/parlor business model, Black Maria studio as controlled production environment. B. Lumière Cinématographe: projection technology and public screening revenue model, Paris exhibitions establishing communal viewing business"
            },
            "III": {
                "title": "Early Content: From Actuality to Narrative Stirrings",
                "main_argument": "Early films evolved from scientific curiosities to entertainment spectacles through the paradigmatic intersection of technological capabilities and market demands, with cultural controversies revealing cinema's emerging social and economic impact",
                "estimated_words": 1100,
                "builds_on_previous": "Exhibition models and business strategies from Section II",
                "sets_up_next": "Porter's technological and commercial narrative innovations",
                "transition_notes": "Show how audience demand and revenue opportunities drove technological sophistication in storytelling",
                "outline": "Actuality films as technological demonstration and vaudeville business integration; *The Kiss* controversy revealing cinema's cultural and economic power; Early audience reception driving technological and commercial evolution toward narrative entertainment"
            },
            "IV": {
                "title": "The Dawn of American Narrative: Edwin S. Porter",
                "main_argument": "Porter's *The Great Train Robbery* represents the paradigmatic breakthrough where technological innovation (editing techniques) merged with commercial insight (narrative appeal) to establish American cinema's industrial foundation",
                "estimated_words": 1600,
                "builds_on_previous": "Market demand for sophisticated content and technological possibilities from Section III",
                "sets_up_next": "Mass audience business model enabled by narrative technology",
                "transition_notes": "Establish Porter's innovations as enabling the business transformation to mass entertainment",
                "outline": "Porter's position at Edison studios linking technological capability with commercial production; Analysis of *The Great Train Robbery* as technological breakthrough (editing, cross-cutting) and business innovation (narrative engagement); Impact on American film development through paradigmatic integration of technical and commercial advancement"
            },
            "V": {
                "title": "The Nickelodeon Boom and the New Mass Audience",
                "main_argument": "The nickelodeon phenomenon exemplifies the paradigmatic transformation where technological accessibility (projection standardization) combined with business innovation (low-price/high-volume model) to create America's first mass entertainment industry",
                "estimated_words": 1800,
                "builds_on_previous": "Porter's narrative technology and commercial breakthrough",
                "sets_up_next": "Industrial consolidation attempts driven by technological control and business monopolization",
                "transition_notes": "Connect individual innovation to industry-wide technological and business transformation",
                "outline": "Nickelodeon emergence through technological standardization and business model innovation; Working-class and immigrant audiences as new market created by technological accessibility; Economic impact through paradigmatic intersection of technical distribution and commercial exhibition; Cultural significance as technological democracy enabling business expansion"
            },
            "VI": {
                "title": "Industrialization and Monopoly: The Motion Picture Patents Company",
                "main_argument": "The MPPC represented the paradigmatic attempt at industrial monopoly through technological control (patent consolidation) and business integration (vertical control), demonstrating how technological ownership became inseparable from commercial dominance",
                "estimated_words": 1500,
                "builds_on_previous": "Mass audience business model and technological distribution from Section V",
                "sets_up_next": "Independent resistance through technological and geographical business innovation",
                "transition_notes": "Show tension between technological/business consolidation and creative/entrepreneurial independence",
                "outline": "MPPC formation through paradigmatic merger of patent technology and business strategy; Edison's leadership in technological control and commercial monopolization; Vertical integration demonstrating technological ownership as business power; Impact on production and distribution through paradigmatic suppression of technological and commercial innovation"
            },
            "VII": {
                "title": "Resistance and Relocation: The Independents and the Rise of Hollywood",
                "main_argument": "Independent producers' resistance exemplifies the paradigmatic principle that technological innovation and business entrepreneurship ultimately overcome monopolistic control, with geographical relocation enabling both technical freedom and commercial innovation",
                "estimated_words": 1700,
                "builds_on_previous": "MPPC technological and business monopoly attempt from Section VI",
                "sets_up_next": "Dissolution of monopolistic control and establishment of competitive technological and business environment",
                "transition_notes": "Connect resistance to monopoly with geographic and technological transformation enabling business innovation",
                "outline": "Independent producers demonstrating paradigmatic entrepreneurship through technological and business resistance; Geographical relocation to California as technological advantage (climate, geography) and business strategy (legal independence); Hollywood's emergence through paradigmatic integration of technological capability and commercial innovation; Star system development as technological (performance) and business (marketing) advancement"
            },
            "VIII": {
                "title": "The Fall of the Trust and the Dawn of a New Era",
                "main_argument": "The dissolution of the MPPC and rise of legitimate Hollywood studios demonstrates the paradigmatic principle that sustainable industry development requires the integration of technological innovation with competitive business practices, marking cinema's transition from experimental monopoly to established democratic industry",
                "estimated_words": 1600,
                "builds_on_previous": "Independent technological and business resistance establishing Hollywood from Section VII",
                "sets_up_next": "Future American film industry development through continued technological and business evolution",
                "transition_notes": "Provide paradigmatic closure while establishing framework for continued technological and business development",
                "outline": "MPPC legal challenges and dissolution as paradigmatic victory of competitive innovation over monopolistic control; Rise of major studios through technological standardization and business legitimization; Industry establishment through paradigmatic integration of technological professionalism and commercial sustainability; Setting stage for Golden Age development through continued technological and business advancement"
            }
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
            },
            "IV": {
                "prompt_template": "Focus on Porter as a pivotal figure in American narrative development. Analyze *The Great Train Robbery* as a case study in early storytelling innovation.",
                "tone_instructions": "Biographical and analytical, emphasizing innovation and American cinema development"
            },
            "V": {
                "prompt_template": "Examine the nickelodeon phenomenon as a social and economic transformation. Connect technological innovation to mass culture development.",
                "tone_instructions": "Social historical analysis, emphasizing demographic change and cultural accessibility"
            },
            "VI": {
                "prompt_template": "Present the MPPC as an early example of media monopolization. Analyze business strategies and their impact on creative development.",
                "tone_instructions": "Business and legal analysis, explaining complex corporate strategies clearly"
            },
            "VII": {
                "prompt_template": "Tell the story of independent resistance and geographical shift as entrepreneurial innovation. Emphasize Hollywood's emergence as an industry center.",
                "tone_instructions": "Narrative of entrepreneurial resistance and geographical transformation"
            },
            "VIII": {
                "prompt_template": "Conclude with the transition from experimental medium to established industry. Synthesize themes while preparing for future developments.",
                "tone_instructions": "Synthesizing and forward-looking, providing closure while maintaining scholarly momentum"
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
            },
            "IV": {
                "required_evidence": "*The Great Train Robbery* production records, Edison studio documentation, Porter's career timeline, early narrative film examples",
                "comprehensive_query": "Analyze Porter's innovations within the context of American cinema development and narrative evolution."
            },
            "V": {
                "required_evidence": "Nickelodeon attendance figures, working-class neighborhood locations, admission prices and profit margins, immigrant audience studies",
                "comprehensive_query": "Examine economic and social data to demonstrate cinema's transformation into mass entertainment medium."
            },
            "VI": {
                "required_evidence": "MPPC formation documents, patent litigation records, Edison vs. independent lawsuits, licensing agreement details",
                "comprehensive_query": "Analyze legal and business documents to explain monopolization attempt and its impact on industry development."
            },
            "VII": {
                "required_evidence": "Independent producer activities, California relocation records, early Hollywood studio establishment, star system development",
                "comprehensive_query": "Document geographical and business transformation that established Hollywood as industry center."
            },
            "VIII": {
                "required_evidence": "MPPC dissolution records, court decisions, major studio formation documents, industry legitimization evidence",
                "comprehensive_query": "Synthesize legal, economic, and cultural evidence to show industry's transition from experimental to established medium."
            }
        }
        return requirements.get(roman_numeral, requirements["I"])
    
    def _get_tech_paradigm_focus(self, roman_numeral: str) -> str:
        """Get technology paradigm focus for each section"""
        tech_focus = {
            "I": "Scientific experimentation and motion studies as technological foundation - Muybridge serial photography, Marey chronophotography, laboratory innovation driving commercial potential",
            "II": "Competing technological paradigms - Edison's individual viewing (Kinetoscope) vs. Lumière's communal projection (Cinématographe), celluloid film stock standardization",
            "III": "Technology enabling content evolution - from actuality documentation to staged entertainment, technical capabilities shaping narrative possibilities",
            "IV": "Narrative technology innovation - Porter's editing techniques, cross-cutting, location shooting as breakthrough in cinematic storytelling technology",
            "V": "Exhibition technology transformation - nickelodeon projection systems making cinema accessible to mass audiences, standardization enabling widespread distribution",
            "VI": "Patent technology consolidation - MPPC's attempt to control technological standards through patent pooling and equipment monopolization",
            "VII": "Geographic technology advantages - California's climate and geography enabling year-round production, technological independence from East Coast constraints",
            "VIII": "Technology legitimization - standardized production methods, technical professionalism establishing cinema as legitimate technological industry"
        }
        return tech_focus.get(roman_numeral, "Technological innovation and its impact on cinema development")
    
    def _get_business_paradigm_focus(self, roman_numeral: str) -> str:
        """Get business paradigm focus for each section"""
        business_focus = {
            "I": "Scientific research transitioning to commercial investment - laboratory experiments attracting entrepreneurial capital, patent potential driving business interest",
            "II": "Competing business models - Edison's arcade/parlor individual revenue vs. Lumière's public screening communal revenue, market competition shaping industry structure",
            "III": "Content monetization strategies - vaudeville circuit integration, controversy generating publicity and revenue, entertainment value over scientific novelty",
            "IV": "Narrative as business advantage - storytelling creating repeat customers, Porter's innovations proving commercial viability of longer-form content",
            "V": "Mass market business transformation - nickelodeon low-price/high-volume model, working-class audience creating sustainable revenue streams, habitual consumption patterns",
            "VI": "Industrial monopolization attempt - MPPC vertical integration strategy, patent enforcement as business control, Eastman Kodak exclusive agreements",
            "VII": "Entrepreneurial resistance and innovation - Independent producers' business strategies, California relocation for competitive advantage, star system as marketing innovation",
            "VIII": "Industry legitimization and consolidation - MPPC dissolution opening competitive markets, Hollywood establishing sustainable business practices, transition from novelty to industry"
        }
        return business_focus.get(roman_numeral, "Business innovation and economic transformation in cinema development")

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
        # Example: Custom table mapping (optional)
        custom_tables = {
            "I": ["film_history_sections_week1", "film_history_scaffolding_week1"],
            "VIII": ["film_history_sections_week1", "Markdown Outline for SQL  Sheet1", "film_history_revision_checklist_week1"]
        }
        
        generator = AcademicChapterGenerator(project_name, custom_table_mapping=custom_tables)
        
        # Example: Dynamically modify table selection for specific section
        generator.set_table_mapping_for_section("IV", [
            "film_history_sections_week1", 
            "film_history_evidence_week1",
            "Markdown Outline for SQL  Sheet1"
        ])
        
        # Show current configuration
        print(f"📊 Table mapping configuration:")
        for section, tables in generator.get_current_table_mapping().items():
            print(f"  Section {section}: {len(tables)} tables")
        
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

# Example: Simple test with default configuration
async def test_simple_generation():
    """Simple test with default table mapping"""
    generator = AcademicChapterGenerator("textbook_pilot")
    return await generator.generate_complete_chapter()

# Example: Test with completely custom table mapping
async def test_custom_generation():
    """Test with completely custom table selection"""
    custom_mapping = {
        "I": ["film_history_sections_week1"],
        "II": ["film_history_sections_week1", "film_history_evidence_week1"],
        "III": ["film_history_sections_week1", "film_history_revision_checklist_week1"],
        # ... customize all sections as needed
    }
    
    generator = AcademicChapterGenerator("textbook_pilot", custom_table_mapping=custom_mapping)
    return await generator.generate_complete_chapter()

if __name__ == "__main__":
    # Test with your existing textbook_pilot project
    import asyncio
    asyncio.run(test_academic_generation())
