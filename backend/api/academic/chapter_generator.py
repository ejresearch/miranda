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
    - Creates engaging narrative history in the style of Mystery of History

    CONFIGURATION:
    - ALL BUCKETS: Every section queries ALL available document buckets for comprehensive source access
    - TARGETED TABLES: Each section uses intentionally selected SQL tables for specific data needs
    - NATURAL STORYTELLING: Like the best history lecture you've ever heard
    """

    # Comprehensive writing guidelines for natural academic prose
    HUMANIZING_WRITING_GUIDELINES = """
You are writing an academic textbook in the engaging style of Mystery of History by Linda Lacour Hobar. Your goal is to create the best history lecture your reader has ever experienced - scholarly but conversational, detailed but flowing, like a passionate professor sharing fascinating discoveries.

STORYTELLING APPROACH - "BEST LECTURE YOU'VE EVER HEARD"

You are 85% chatty professor, 15% documentary narrator. Write like someone who has spent years in archives and laboratories, uncovering details that illuminate this remarkable period. Your reader trusts you to reveal the full richness of what you've found.

VOICE AND TONE:
• Write like you're sharing discoveries with a colleague over coffee
• Show genuine enthusiasm for the material without being breathless
• Use natural, conversational language - contractions are fine
• Be the professor whose students hang on every word because you make history feel alive
• Balance scholarly expertise with accessible explanation

NARRATIVE FLOW PRINCIPLES:
• Let the story pull readers forward naturally - no formulaic transitions
• Each section should flow like a chapter in a novel, building toward the next
• Use scene-setting purposefully to illuminate analysis, not just for atmosphere
• Connect events and people through natural cause-and-effect progression
• Make readers feel like they're discovering history alongside you

NATURAL LANGUAGE PATTERNS:
• Vary sentence length (8-25 words) but favor shorter, punchy sentences
• Use active voice 90% of the time with strong, specific verbs
• Choose concrete words over abstract jargon
• Start paragraphs with clear, engaging topic sentences
• Build arguments with natural connectors: 'and', 'but', 'so', 'then', 'because'
• Ask genuine questions and answer them immediately (once per 300 words max)

ENGAGING HISTORICAL WRITING:
• Start with specific moments, people, or problems that draw readers in
• Use concrete details to create mental pictures
• Show people making decisions rather than just stating outcomes
• Include small human details that make historical figures feel real
• Connect individual stories to broader patterns of change
• Reveal information in the order readers would naturally want to know it

ABSOLUTELY AVOID (BANNED COMPLETELY):

FORMULAIC TRANSITIONS AND PHRASES:
At the end of the day, With that being said, It goes without saying, In a nutshell, Needless to say, When it comes to, Moving forward, Going forward, On the other hand, In addition, It's important to note, In summary, In conclusion, As previously mentioned, To summarize, To put it simply, As we transition to the next section, The next chapter will explore, Looking ahead, This section examines, Central to this narrative, Ultimately, Moreover, Furthermore, Additionally, Consequently, Therefore, However (at start of sentences)

ACADEMIC JARGON:
Cutting-edge, Leveraging, Seamless integration, Robust framework, Paradigm shift, Synergy, Optimize, Game-changer, Unleash, Uncover, Elevate, Embark, Delve, Navigating (metaphorical), Landscape (metaphorical), Testament, Realm, Virtuoso, Symphony, Vibrant, Tapestry, Bustling, Revolutionize, Foster, Labyrinthine, Enigma, Pivotal, Crucial, Vital, Essential, Significant, Innovative, Demonstrates, Represents, Encompasses, Facilitates

STIFF ACADEMIC PATTERNS:
• "This section will..." • "The purpose of this chapter..." • "In this analysis..." • "It can be argued that..." • "One might consider..." • "It is worth noting..."

FORCED DRAMA:
Little did they know, The stage was set, Plot twist, You won't believe what happened next, Meanwhile back in, As fate would have it, Ironically, History would prove, The die was cast

NATURAL ALTERNATIVES TO USE:
Instead of academic hedging → state facts directly
Instead of "however" → use "but" or start new sentence
Instead of "demonstrates" → use "shows"
Instead of "significant" → use "major" or "important"
Instead of formulaic transitions → let story flow naturally

MYSTERY OF HISTORY INSPIRATION:
Write with the engaging discovery-focused approach of Linda Lacour Hobar - make readers feel like they're uncovering fascinating connections and understanding how historical events fit together. Show genuine curiosity about the past and help readers see the human drama behind historical developments.

CRITICAL: Every sentence must feel natural and conversational while maintaining scholarly accuracy. If it sounds like it was written by committee or following a template, rewrite it.
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
        Creates engaging narrative history in Mystery of History style
        """

        # Build comprehensive academic prompt
        section_data = self._get_section_details(roman_numeral)
        template_data = self._get_section_template(roman_numeral)
        evidence_req = self._get_evidence_requirements(roman_numeral)

        # Create comprehensive academic instructions with Mystery of History storytelling approach
        academic_instructions = f"""
{self.HUMANIZING_WRITING_GUIDELINES}

SECTION STORY: {section_data['title']}

You are writing the best history lecture your reader has ever heard. This is the story of {section_data['title']} - make it come alive through engaging narrative that reveals fascinating discoveries you've made in your research.

PARADIGMATIC FRAMEWORK - Technology & Business Paradigm:
Frame this story through the lens that American cinema evolved through the dynamic relationship between:
1. TECHNOLOGICAL INNOVATION: Scientific advances and technical capabilities that made new things possible
2. BUSINESS TRANSFORMATION: Economic forces and entrepreneurial strategies that turned possibilities into realities

Show how cinema evolved "from scientific curiosity to industrialized art form" through this interplay.

YOUR STORYTELLING MISSION:
{section_data['main_argument']}

STORY ELEMENTS TO WEAVE IN:
- Technology Focus: {self._get_tech_paradigm_focus(roman_numeral)}
- Business Focus: {self._get_business_paradigm_focus(roman_numeral)}

NATURAL LENGTH: Let the story determine length (aim for 1800-2500 words of rich content)

STORYTELLING APPROACH:
{template_data['approach_description']}

EVIDENCE TO MINE THOROUGHLY:
{evidence_req['rich_sources']}

Your sources contain fascinating details - don't just mention them, explore what they reveal:
{evidence_req['investigation_prompts']}

STORY CONNECTIONS:
This story builds on: {section_data['builds_on_previous']}
And naturally leads to: {section_data['sets_up_next']}
Flow strategy: {section_data['flow_notes']}

WRITING STANDARDS - THE BEST LECTURE YOU'VE EVER HEARD:
• Write as a passionate historian sharing genuine discoveries
• Use scene-setting purposefully to illuminate analysis
• Include rich historical details naturally woven into the narrative
• Show people making decisions and facing challenges
• Connect individual events to larger patterns of change
• Let your enthusiasm for the material show through
• Make complex topics accessible without dumbing them down
• Use conversational language while maintaining scholarly accuracy

DISCOVERY MINDSET:
Think like a detective who has uncovered fascinating evidence:
- What would surprise readers about this evidence?
- What human dramas emerge from the sources?
- What connections reveal deeper patterns?
- What details illuminate the broader transformation?
- What would someone living then have experienced?

FACTUAL ACCURACY IS PARAMOUNT:
• Every claim must be grounded in historical evidence
• Use specific dates, names, measurements, and costs
• Include actual quotes from historical figures when available
• Describe physical environments with concrete details
• Never sacrifice truth for narrative convenience
• If uncertain about details, indicate uncertainty rather than inventing

NATURAL FLOW REQUIREMENTS:
• Start where the previous section's story naturally leads
• End in a way that makes readers want to know what happens next
• Use transitions that feel like natural story progression, not forced connections
• Let the cause-and-effect relationships drive the narrative forward

Write this section as if you're sharing an incredible true story with someone who loves learning about the past. Make them feel like they're discovering this history alongside you, understanding not just what happened but why it mattered and how it all fits together. Most importantly, frame everything through the technology/business paradigm while maintaining absolute factual accuracy and natural storytelling flow.

Remember: You're not writing a report about this topic - you're telling the story of how this remarkable transformation happened, one that changed American culture forever.
"""

        # Get relevant buckets and tables using your existing structure
        relevant_buckets = self._get_relevant_buckets(roman_numeral)
        relevant_tables = self._get_relevant_tables(roman_numeral)

        print(f"[ACADEMIC] Section {roman_numeral} will use:")
        print(f"  - Buckets: {relevant_buckets}")
        print(f"  - Tables: {relevant_tables}")
        print(f"  - Instructions: {len(academic_instructions)} chars")
        print(f"  - Style: Mystery of History engaging narrative")

        # Return request compatible with your existing writing system
        return {
            "project_id": self.project_name,
            "prompt_tone": "engaging_historian",
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
        """Assemble complete chapter from sections with engaging introduction"""
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

        # Create chapter with engaging introduction in Mystery of History style
        chapter_header = f"""# Chapter {chapter_num}: The Birth of an Industry
## American Cinema from Invention to Hollywood's Rise (1890s–1915)

What if I told you that American cinema began not in Hollywood, but in a peculiar tar-paper shack in New Jersey that looked like a police wagon? That the first movies were viewed by one person at a time through a peephole? That a bet about a horse's galloping gait launched an entire industry?

This is the story of how moving pictures evolved from scientific curiosity to America's first mass entertainment industry - a transformation driven by the dynamic relationship between technological innovation and business opportunity. We'll follow inventors like Edison and the Lumière brothers as they raced to capture motion itself, watch entrepreneurs discover that workers and immigrants would pay nickels to see these moving images, and witness the dramatic battles between monopolists and independent filmmakers that ultimately created Hollywood.

This isn't just the story of technology or business alone, but of how the two forces combined to create something entirely new: an industrialized art form that would reshape American culture forever.

---

"""

        sections_content = []
        for section_num, section_title, content in all_sections:
            sections_content.append(content)  # No section headers - let content flow naturally

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
                prompt="Mystery of History style engaging narrative history",
                result=content,
                metadata_json={
                    "chapter_number": chapter_num,
                    "total_sections": section_count,
                    "total_words": total_words,
                    "generation_type": "academic_chapter",
                    "writing_style": "mystery_of_history_narrative"
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
            "I": "The Scientific Dream of Living Pictures",
            "II": "Competing Visions: Edison vs. the Lumières", 
            "III": "From Novelty to Story: Early Film Content",
            "IV": "The Great Train Robbery: American Narrative is Born",
            "V": "Five Cents and a Dream: The Nickelodeon Revolution",
            "VI": "The Trust: When Innovation Meets Monopoly",
            "VII": "Breaking Free: The Road to Hollywood",
            "VIII": "A New Industry: From Experiment to Empire"
        }
        return titles.get(roman_numeral, f"Section {roman_numeral}")

    def _get_expected_summary(self, roman_numeral: str) -> str:
        summaries = {
            "I": "Shows how Victorian scientific curiosity about motion attracted entrepreneurial investment, setting the technological and business foundation for cinema",
            "II": "Contrasts Edison's individual viewing business model with Lumière's communal projection approach, establishing competing paradigms",  
            "III": "Traces the evolution from documentary actualities to narrative entertainment, revealing cinema's emerging cultural power",
            "IV": "Demonstrates how Porter's editing innovations in The Great Train Robbery merged technological breakthrough with commercial insight",
            "V": "Chronicles how nickelodeons transformed cinema into mass entertainment through technological accessibility and business innovation",
            "VI": "Details the MPPC's attempt to monopolize cinema through patent consolidation and the resistance it sparked",
            "VII": "Follows independent filmmakers' geographical and business strategies that broke the Trust's control and created Hollywood",
            "VIII": "Concludes with cinema's transformation from experimental medium to legitimate industry through competitive innovation"
        }
        return summaries.get(roman_numeral, f"Summary for Section {roman_numeral}")

    def _get_section_details(self, roman_numeral: str) -> Dict[str, Any]:
        details = {
            "I": {
                "title": "The Scientific Dream of Living Pictures",
                "main_argument": "The story of how Victorian scientific fascination with motion studies created both the technological foundation and commercial opportunity for cinema, transforming laboratory experiments into entrepreneurial ventures",
                "builds_on_previous": "This opens the story - sets the technological and business framework",  
                "sets_up_next": "The stage is set for Edison and Lumière's competing approaches to turn motion capture into profitable entertainment",
                "flow_notes": "End with the momentum building toward commercial competition between different technological and business visions"
            },
            "II": {
                "title": "Competing Visions: Edison vs. the Lumières",
                "main_argument": "The dramatic contrast between Edison's individual viewing arcade model and the Lumières' communal projection approach, showing how different technological choices led to different business strategies and cultural impacts",
                "builds_on_previous": "Scientific foundation from Section I now becomes commercial competition",
                "sets_up_next": "These competing technologies create demand for different types of content",
                "flow_notes": "Show the human drama of competing inventors with different visions for cinema's future"
            },
            "III": {
                "title": "From Novelty to Story: Early Film Content", 
                "main_argument": "How early films evolved from simple documentation to entertainment spectacles, revealing cinema's power to provoke cultural reactions and drive business innovation",
                "builds_on_previous": "Exhibition technologies from Section II now need content to show",
                "sets_up_next": "Growing audience demand sets stage for Porter's narrative breakthrough",
                "flow_notes": "Connect the technology/business foundation to the cultural impact and audience development"
            },
            "IV": {
                "title": "The Great Train Robbery: American Narrative is Born",
                "main_argument": "Porter's masterpiece represents the moment when technological innovation (editing techniques) perfectly merged with commercial insight (audience engagement) to create the foundation of American narrative cinema",
                "builds_on_previous": "Audience appetite for sophisticated content from Section III",
                "sets_up_next": "Porter's success demonstrates the potential for mass audience entertainment",
                "flow_notes": "This is the breakthrough moment - show the excitement and significance"
            },
            "V": {
                "title": "Five Cents and a Dream: The Nickelodeon Revolution",
                "main_argument": "The nickelodeon boom demonstrates how technological accessibility combined with democratic pricing created America's first mass entertainment industry, transforming cinema from novelty to cultural necessity",
                "builds_on_previous": "Porter's narrative innovations create content perfect for mass audiences",
                "sets_up_next": "Success attracts attention from those who want to control and monopolize the industry",
                "flow_notes": "Show the explosive growth and cultural transformation - the exciting expansion"
            },
            "VI": {
                "title": "The Trust: When Innovation Meets Monopoly",
                "main_argument": "The MPPC's formation shows how technological control became a weapon for business monopolization, creating the conflict that would reshape the industry",
                "builds_on_previous": "Mass success from Section V attracts monopolistic attention",
                "sets_up_next": "Oppressive control sparks resistance and innovation among independents",
                "flow_notes": "Build tension - show the power struggle and what's at stake"
            },
            "VII": {
                "title": "Breaking Free: The Road to Hollywood", 
                "main_argument": "Independent filmmakers' resistance through geographical relocation and business innovation demonstrates how entrepreneurial creativity overcomes monopolistic control",
                "builds_on_previous": "MPPC control from Section VI creates the conflict that drives this resistance",
                "sets_up_next": "Independent success sets stage for the Trust's downfall and industry transformation",
                "flow_notes": "This is the exciting rebellion - show the adventure and ingenuity of the escape to California"
            },
            "VIII": {
                "title": "A New Industry: From Experiment to Empire",
                "main_argument": "The dissolution of the MPPC and rise of competitive studios demonstrates that sustainable industry development requires the integration of technological innovation with competitive business practices",
                "builds_on_previous": "Independent resistance from Section VII achieves victory",
                "sets_up_next": "Foundation is laid for Hollywood's Golden Age and continued evolution",
                "flow_notes": "Bring the story to a satisfying conclusion while showing this is just the beginning of cinema's larger story"
            }
        }
        return details.get(roman_numeral, details["I"])

    def _get_section_template(self, roman_numeral: str) -> Dict[str, str]:
        templates = {
            "I": {
                "approach_description": "Open with the wonder of Victorian-era motion studies - make readers feel the excitement of scientific discovery becoming commercial opportunity. Use Muybridge and Marey as fascinating characters whose curiosity launched an industry."
            },
            "II": {
                "approach_description": "Tell this as a story of competing inventors with dramatically different visions. Show the human personalities behind Edison and the Lumières, and make readers understand what was at stake in their competition."
            },
            "III": {
                "approach_description": "Focus on how audiences reacted to early films - especially controversial ones like The Kiss. Show cinema discovering its cultural power and filmmakers learning to create content that engaged rather than just amazed."
            },
            "IV": {
                "approach_description": "Make Porter come alive as the breakthrough innovator. Focus on The Great Train Robbery as a turning point - show what was revolutionary about it and why audiences were so captivated."
            },
            "V": {
                "approach_description": "Capture the excitement and democracy of the nickelodeon boom. Show how five cents changed everything - bring readers inside these small theaters and show the cultural transformation happening."
            },
            "VI": {
                "approach_description": "Present the MPPC as a dramatic power grab that threatened everything that was exciting about early cinema. Show the conflict between control and creativity, monopoly and innovation."
            },
            "VII": {
                "approach_description": "Tell this as an adventure story - the great escape to California. Show the courage and ingenuity of independent filmmakers breaking free from East Coast control to create something new."
            },
            "VIII": {
                "approach_description": "Bring the story to a triumphant conclusion that shows how the struggle between control and freedom shaped cinema's future. Connect this transformation to the larger American story of innovation and opportunity."
            }
        }
        return templates.get(roman_numeral, templates["I"])

    def _get_evidence_requirements(self, roman_numeral: str) -> Dict[str, str]:
        requirements = {
            "I": {
                "rich_sources": "Muybridge's detailed experimental setup, equipment costs, and Stanford's investment; Marey's chronophotographic innovations and technical specifications; patent filings and early investor interest",
                "investigation_prompts": "What exactly did Muybridge's setup look like and cost? What drove Stanford to invest? How did Marey's approach differ technically? What do the patent filings reveal about commercial ambitions?"
            },
            "II": {
                "rich_sources": "Edison's Kinetoscope specifications and Black Maria studio details; Lumière Cinématographe technical innovations; first screening attendance and audience reactions; business model comparisons",
                "investigation_prompts": "What was it like inside the Black Maria? How exactly did the Kinetoscope work mechanically? What were people's actual reactions to first Cinématographe screenings? What were the profit margins of each approach?"
            },
            "III": {
                "rich_sources": "Contemporary newspaper reviews of The Kiss and other early films; vaudeville circuit integration details; audience attendance figures; cultural controversy documentation", 
                "investigation_prompts": "What exactly did critics write about The Kiss? How did vaudeville owners incorporate films? What were the attendance numbers? How did different communities react to early cinema?"
            },
            "IV": {
                "rich_sources": "Porter's career background and Edison Studios documentation; The Great Train Robbery production details and box office figures; technical innovation specifications; contemporary film reviews",
                "investigation_prompts": "What was Porter's background before Edison? How exactly did he achieve the cross-cutting effects? What were the actual box office numbers? How did audiences and critics respond?"
            },
            "V": {
                "rich_sources": "Nickelodeon attendance figures, demographics, and profit margins; theater locations and physical descriptions; film programming details; social impact documentation",
                "investigation_prompts": "How many people actually attended nickelodeons daily? What did these theaters look like and feel like? Who was in the audiences? What were the economics for theater owners?"
            },
            "VI": {
                "rich_sources": "MPPC formation documents and member agreements; patent consolidation details; legal enforcement actions; independent filmmaker challenges; Eastman Kodak exclusive contracts",
                "investigation_prompts": "What exactly were the MPPC's licensing terms? How much did patent violations cost? What legal tactics did they use? How did independents try to work around the restrictions?"
            },
            "VII": {
                "rich_sources": "California relocation records and studio establishment details; independent producer strategies; star system development; geographic advantages documentation",
                "investigation_prompts": "Why exactly did filmmakers choose California? What were the specific advantages? How did the star system develop as a business strategy? What were the economics of independent production?"
            },
            "VIII": {
                "rich_sources": "MPPC dissolution legal documents; court decisions and antitrust actions; major studio establishment records; industry legitimization evidence",
                "investigation_prompts": "What exactly led to the MPPC's legal downfall? How did the major studios emerge from this chaos? What were the new business models? How did the industry structure change?"
            }
        }
        return requirements.get(roman_numeral, requirements["I"])

    def _get_tech_paradigm_focus(self, roman_numeral: str) -> str:
        """Get technology paradigm focus for each section"""
        tech_focus = {
            "I": "Motion capture innovations - Muybridge's sequential photography and Marey's chronophotography as technological breakthroughs that made cinema possible",
            "II": "Competing technological approaches - Edison's mechanical individual viewing vs. Lumière's optical projection systems, each creating different possibilities",
            "III": "Content technology evolution - from simple recording to staged entertainment, showing how technical capabilities shaped narrative possibilities",
            "IV": "Editing technology breakthrough - Porter's cross-cutting and narrative techniques as revolutionary advances in cinematic storytelling technology",
            "V": "Projection technology democratization - standardized equipment making cinema accessible to mass audiences through technological reliability and affordability",
            "VI": "Technology as control mechanism - patent consolidation used as weapon to monopolize access to essential filmmaking equipment and processes",
            "VII": "Geographic technology advantages - California's climate and resources enabling year-round production and technological independence from East Coast constraints",
            "VIII": "Technology industry maturation - standardized professional methods and competitive innovation replacing monopolistic control over technological development"
        }
        return tech_focus.get(roman_numeral, "Technological innovation driving cinema development")

    def _get_business_paradigm_focus(self, roman_numeral: str) -> str:
        """Get business paradigm focus for each section"""
        business_focus = {
            "I": "Scientific research attracting commercial investment - laboratory experiments becoming entrepreneurial opportunities with patent potential and investor backing",
            "II": "Competing business models - Edison's arcade revenue strategy vs. Lumière's public screening model, each targeting different markets and revenue streams",
            "III": "Entertainment value monetization - content creating repeat customers, controversy generating publicity, integration with existing entertainment circuits",
            "IV": "Narrative as competitive advantage - storytelling creating audience loyalty, longer films justifying higher prices, content differentiation in growing market",
            "V": "Mass market democratization - low-price/high-volume model creating sustainable revenue from working-class audiences, habitual consumption patterns",
            "VI": "Monopolization through vertical integration - controlling technology, production, distribution, and exhibition to eliminate competition and maximize profits",
            "VII": "Entrepreneurial resistance strategies - geographic relocation, star system development, and independent financing as competitive responses to monopoly",
            "VIII": "Competitive industry structure - antitrust victory enabling multiple studios, diverse content, and sustainable business practices replacing monopolistic control"
        }
        return business_focus.get(roman_numeral, "Business innovation driving cinema commercialization")

    def _roman_to_number(self, roman: str) -> int:
        roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
        return roman_map.get(roman, 1)

    def _number_to_roman(self, num: int) -> str:
        number_map = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        return number_map.get(num, "I")


# Standalone test function for your textbook_pilot project
async def test_academic_generation():
    """Test the academic chapter generation with Mystery of History engaging style"""
    project_name = "textbook_pilot"

    print(f"🎬 Testing Academic Chapter Generation - Mystery of History Style")
    print(f"📁 Project: {project_name}")
    print("=" * 50)

    try:
        generator = AcademicChapterGenerator(project_name)

        print(f"✍️ Style: Mystery of History engaging narrative")
        print(f"📝 Approach: Best history lecture you've ever heard")

        result = await generator.generate_complete_chapter(chapter_num=1)

        print(f"\n🎉 Generation completed successfully!")
        print(f"📊 Generated {result['metadata']['total_words']:,} words")
        print(f"📝 Sections: {result['metadata']['sections_generated']}/{result['metadata']['sections_generated'] + result['metadata']['sections_failed']}")
        print(f"✍️ Writing style: Engaging narrative history")

        # Save to markdown file as well
        output_path = f"projects/{project_name}/Chapter_1_Mystery_Style_Generated.md"
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
    # Test with Mystery of History engaging style
    import asyncio
    asyncio.run(test_academic_generation())
