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
    - Incorporates humanizing writing guidelines for natural, accessible academic prose

    CONFIGURATION:
    - ALL BUCKETS: Every section queries ALL available document buckets for comprehensive source access
    - TARGETED TABLES: Each section uses intentionally selected SQL tables for specific data needs
    - HUMANIZED WRITING: Natural language patterns, concrete details, accessible academic tone
    """

    # Comprehensive writing guidelines for natural academic prose
    HUMANIZING_WRITING_GUIDELINES = """
You are writing an academic textbook. These are your comprehensive writing guidelines. Your output will adhere to these guidelines exactly.

POSITIVE DIRECTIVES (How you SHOULD write)

Clarity and brevity
• Craft sentences that average 10–20 words and focus on a single idea, with occasional longer sentences for variety.
• Start paragraphs with clear topic sentences that state the main point directly.

Active voice and direct verbs
• Use active voice 90% of the time. Choose strong, specific verbs over weak linking verbs.
• Write "Edison invented the Kinetoscope" not "The Kinetoscope was invented by Edison."

Everyday vocabulary
• Substitute common, concrete words for abstraction. Use "show" instead of "demonstrate," "help" instead of "facilitate."
• Replace academic jargon: "paradigmatic" → "dual approach," "encompasses" → "includes," "facilitates" → "makes possible"

Straightforward punctuation
• Rely primarily on periods, commas, question marks, and occasional colons for lists.
• NO semicolons ever. Break long sentences into two shorter ones instead.

Varied sentence length, minimal complexity
• Mix short and medium sentences. Avoid stacking clauses and complex subordination.
• Maximum one subordinate clause per sentence. Prefer coordination over subordination.

Logical flow without buzzwords
• Build arguments with plain connectors: 'and', 'but', 'so', 'then', 'because'.
• Use transitions that sound natural: "Next," "This led to," "As a result," "By 1905"

Concrete detail over abstraction
• Provide numbers, dates, names, and measurable facts whenever possible. Use specific examples.
• Always give concrete examples before explaining abstract concepts.

Human cadence and engagement
• Vary paragraph length (3-8 sentences). Ask a genuine question no more than once per 300 words, and answer it immediately.
• Use specific details that create mental pictures for readers.

NEGATIVE DIRECTIVES (What you MUST AVOID)

A. Punctuation to avoid

Semicolons (;)
✗ Example: 'Edison researched extensively; his results were groundbreaking.'
✓ Rewrite: 'Edison researched extensively, and his results were groundbreaking.'

B. Overused words & phrases to ban completely
• Never use any of the following in any form:

TRANSITION OVERUSE: At the end of the day, With that being said, It goes without saying, In a nutshell, Needless to say, When it comes to, A significant number of, It's worth mentioning, Last but not least, Moving forward, Going forward, On the other hand, Notwithstanding, Takeaway, As a matter of fact, In the realm of, In addition, It's important to note, In summary, In conclusion, Remember that, Take a dive into, In the midst, As previously mentioned, It's worth noting that, To summarize, To put it simply, As well as, In contrast, In order to, Due to, Given that, To consider, As a professional, Subsequently, In the world of, Ultimately

ACADEMIC JARGON: Cutting-edge, Leveraging, Seamless integration, Robust framework, Paradigm shift, Synergy, Scale-up, Optimize, Game-changer, Unleash, Uncover, Elevate, Embark, Delve, Navigating (metaphorical), Landscape (metaphorical), Testament (e.g., 'a testament to'), Realm, Virtuoso, Symphony, Vibrant, Tapestry, Bustling, Digital landscape, Hustle and bustle, Revolutionize, Foster, Labyrinthine, Labyrinth, Gossamer, Enigma, Whispering, Sights unseen, Sounds unheard, Dance, Metamorphosis, Indelible, Soul, Crucible, Out of the box, Underscores, Pesky, Promptly, Dive into, In today's digital era, Reverberate, Enhance, Emphasise, Enable, Nestled, Remnant, Moist

WEAK QUALIFIERS: Arguably, Generally, Essentially, Specifically, Importantly, Notably, Indeed, Alternatively, Despite, While, Unless, Also, Even though, Even if, Arguably, You may want to, This is not an exhaustive list, You could consider, It depends on, Sure, Folks

OVERUSED SINGLE WORDS: however, moreover, furthermore, additionally, consequently, therefore, ultimately, generally, essentially, arguably, significant, innovative, efficient, dynamic, ensure, foster, leverage, utilize, encompasses, facilitates, demonstrates, represents, serves, appears, seems, tends, burgeoning, paradigmatic, strategic, comprehensive, extensive, substantial, considerable, multifaceted, intricate, profound, pivotal, crucial, vital, essential, delve

✗ Example: 'Moreover, the paradigmatic approach encompasses innovative strategies that leverage cutting-edge technology.'
✓ Rewrite: 'The dual approach includes new strategies that use advanced technology.'

C. Overused single words to minimize or ban
however, moreover, furthermore, additionally, consequently, therefore, ultimately, generally, essentially, arguably, significant, innovative, efficient, dynamic, ensure, foster, leverage, utilize

✗ Example: 'We must leverage dynamic, innovative approaches.'
✓ Rewrite: 'We must try new approaches.'

D. Sentence-structure patterns to eliminate

Complex, multi-clause sentences.
✗ Example: 'Because the technology was incomplete and the timeline was short, Edison postponed the demonstration, although he had secured funding.'
✓ Preferred: 'The technology was incomplete. Edison had little time. He postponed the demonstration. Funding was ready.'

• Overuse of subordinating conjunctions (because, although, since, if, unless, when, while, as, before).
• Sentences containing more than one verb phrase.
• Chains of prepositional phrases.
• Multiple dependent clauses strung together.
• Artificial parallelism used solely for rhythm.

E. Tone and style
• Never mention or reference AI limitations.
• Do not apologize.
• Do not hedge; state facts directly.
• Avoid clichés, metaphors about journeys, music, or landscapes.
• Maintain formal yet approachable tone that is free of corporate jargon.

ACADEMIC-SPECIFIC GUIDELINES

Historical writing standards
• Use past tense for historical events and developments
• Present tense for ongoing scholarly analysis and current understanding
• Include specific dates, names, and quantifiable data
• Cite sources naturally within the text flow
• Give concrete examples first, then explain their significance

Evidence integration
• Start with specific facts: "In 1878, Muybridge photographed a galloping horse using 12 cameras."
• Then explain significance: "This experiment proved that all four hooves leave the ground simultaneously."
• Connect to broader themes: "The success attracted investors who saw commercial potential in motion photography."
• Avoid starting paragraphs with abstract concepts

Professional academic tone
• Write for undergraduate students who are intelligent but unfamiliar with the topic
• Explain technical concepts using everyday comparisons when possible
• Use discipline-appropriate terminology when necessary, but define it clearly
• Balance scholarly rigor with accessibility - sound smart without being pretentious

Paragraph structure
• Start each paragraph with a clear topic sentence stating the main point
• Support with 2-4 specific examples or pieces of evidence
• End with a sentence connecting to the next paragraph or main argument
• Keep paragraphs focused on one main idea

Sentence variety patterns
• Mix sentence lengths: one 8-word sentence, one 15-word sentence, one 12-word sentence
• Vary sentence beginnings: avoid starting multiple sentences with "The" or "This"
• Use strong verbs: "Edison created" not "Edison was responsible for the creation of"

CRITICAL TRANSFORMATION RULES
• Replace "encompasses" with "includes"
• Replace "facilitates" with "makes possible" or "helps"
• Replace "demonstrates" with "shows"
• Replace "represents" with "is" or "means"
• Replace "significant" with "important" or "major"
• Replace "burgeoning" with "growing" or "expanding"
• Replace "paradigmatic" with "typical" or use the actual concept
• Replace "pivotal" with "key" or "important"
• Replace "profound" with "deep" or "major"

FAILURE TO COMPLY WITH ANY NEGATIVE DIRECTIVE INVALIDATES THE OUTPUT.

When writing each sentence, verify it complies with these directions before moving to the next sentence.
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
        Now includes comprehensive humanizing writing guidelines
        """

        # Build comprehensive academic prompt
        section_data = self._get_section_details(roman_numeral)
        template_data = self._get_section_template(roman_numeral)
        evidence_req = self._get_evidence_requirements(roman_numeral)

        # Create comprehensive academic instructions with paradigmatic framework AND humanizing guidelines
        academic_instructions = f"""
{self.HUMANIZING_WRITING_GUIDELINES}

STORYTELLING VOICE AND APPROACH:

You are telling a story - the story of how American cinema was born. Write as if you're a professor who has spent years studying these people and events, now sharing this compelling narrative with a colleague over coffee. You know these historical figures intimately from the sources - their habits, motivations, and personalities. 

This is not a dry recitation of facts, but a true story that unfolds with natural narrative flow. You're not dramatically narrating, just naturally telling a fascinating story you've lived with. Think of yourself as a storyteller who happens to be a scholar, not a scholar who occasionally tells stories.

NARRATIVE STRUCTURE:
- Present events as they unfolded, building toward consequences
- Show how one decision led to another, creating a chain of causation
- Use the natural dramatic tension that exists in historical competition and conflict
- Let the story breathe - don't rush to conclusions, let events unfold
- Connect human motivations to larger historical forces

ENGAGING STORYTELLING TECHNIQUES:
- Start with compelling moments or turning points
- Use specific scenes and situations to illustrate broader themes
- Show characters making decisions rather than just stating outcomes
- Include moments of uncertainty and discovery
- Reveal information at the pace a reader would naturally want to know it
- Use concrete details to create mental pictures
- Connect the past to relatable human experiences

SECOND-DEGREE WITNESS PERSPECTIVE:
You've spent so much time in the archives and with the evidence that you feel like you almost witnessed these events. Share details that only someone who has deeply studied the period would notice. Root your insights in concrete evidence, but convey the sense that you've reconstructed these moments thoroughly.

NATURAL STORYTELLING FLOW:
Present information in the order someone would naturally discover it. Use conversational transitions: "What's interesting here is..." "This raises the question..." "The evidence shows something surprising..." Build understanding progressively rather than front-loading conclusions.

CRITICAL RESTRAINT GUIDELINES:
Maintain scholarly restraint. Do NOT use dramatic phrases like:
- "Little did they know..." 
- "The stage was set..."
- "Plot twist..."
- "You won't believe what happened next..."
- "The mystery deepens..."
- "Meanwhile, back in..."
- "As fate would have it..."
- "Ironically..."
- "History would prove..."
- "The die was cast..."

Instead use natural academic curiosity:
- "What emerges from the sources is..."
- "The evidence suggests..."
- "This detail caught my attention..."
- "The question becomes..."
- "Looking at the records..."
- "What's interesting about this period is..."
- "The documents reveal..."
- "When you examine the timeline..."

WHAT NOT TO DO - STORYTELLING MISTAKES TO AVOID:

DO NOT write like a historical fiction novel:
✗ "Edison wiped the sweat from his brow as he gazed at his latest invention..."
✓ "Edison's lab notebooks from 1891 show he worked eighteen-hour days on the Kinetoscope..."

DO NOT create dialogue or internal thoughts:
✗ "Porter must have thought to himself, 'This will change everything...'"
✓ "Porter's correspondence suggests he understood the commercial potential..."

DO NOT use omniscient narrator voice:
✗ "As Edison worked in his lab, he had no idea that across the Atlantic..."
✓ "While Edison developed the Kinetoscope in New Jersey, the Lumière brothers in France..."

DO NOT manufacture dramatic moments:
✗ "In a moment that would change cinema forever..."
✓ "The screening on December 28, 1895, marked a turning point..."

DO NOT use modern perspectives inappropriately:
✗ "Edison's invention would soon go viral..."
✓ "Edison's invention quickly gained popularity..."

DO NOT create false suspense:
✗ "But Edison's triumph would be short-lived..."
✓ "Edison's Kinetoscope faced new competition by 1895..."

DO NOT anthropomorphize technology or concepts:
✗ "Cinema was crying out for innovation..."
✓ "The film industry needed technological advancement..."

DO NOT use emotional manipulation:
✗ "Tragically, many independent filmmakers suffered..."
✓ "Independent filmmakers faced significant legal challenges..."

DO NOT write cliffhanger endings:
✗ "But what happened next would shock the industry..."
✓ "The next development came from an unexpected source..."

DO NOT use breathless, excited tone:
✗ "This incredible breakthrough revolutionized everything!"
✓ "This development had wide-ranging effects on the industry..."

FACTUAL ACCURACY IS PARAMOUNT:
- Every factual claim must be grounded in historical evidence
- Use specific dates, names, locations, and numbers from the sources
- If uncertain about a detail, indicate uncertainty rather than inventing
- Prioritize documented facts over dramatic narrative possibilities
- When making logical inferences, clearly signal them as such
- Never sacrifice historical truth for narrative convenience
- The story is compelling because it's true, not because it's embellished

FACTUAL ACCURACY - WHAT NOT TO DO:

DO NOT invent details for dramatic effect:
✗ "Edison's hands trembled as he made the final adjustment..."
✓ "Edison's final adjustments to the Kinetoscope were completed in late 1891..."

DO NOT speculate beyond evidence:
✗ "Porter was probably thinking about his childhood when he..."
✓ "Porter's background in theater likely influenced his approach to..."

DO NOT exaggerate for impact:
✗ "The entire industry was in complete chaos..."
✓ "The film industry faced significant disruption..."

DO NOT present assumptions as facts:
✗ "Everyone in the audience gasped when they saw..."
✓ "Contemporary reviews suggest audiences were surprised by..."

DO NOT romanticize the past:
✗ "In those simpler times when movies were pure magic..."
✓ "During this early period, films served primarily as novelties..."

DO NOT use presentist language:
✗ "Edison's viral moment came when..."
✓ "Edison's breakthrough gained widespread attention when..."

HUMAN-SCALE STORYTELLING:
- Include small, concrete details that make historical figures feel real
- Focus on decision-making moments and human reasoning behind big changes
- Show genuine scholarly interest in these people without manufactured drama
- Reveal character through actions and documented statements
- Connect individual choices to larger historical movements
- Make the past feel immediate and relevant

NARRATIVE PACING AND STRUCTURE:
- Build tension through real historical conflicts and competitions
- Use the natural arc of each section to advance the overall story
- Connect each section to the next with forward momentum
- Balance exposition with action/decision-making
- Show cause and effect relationships clearly
- Let the historical drama emerge from the facts themselves

ACADEMIC TEXTBOOK SECTION: {section_data['title']}

PARADIGMATIC FRAMEWORK - "A Paradigmatic Perspective of The History of American Film":
This chapter operates within a TECHNOLOGY & BUSINESS paradigm that views American cinema evolution through two fundamental lenses:
1. TECHNOLOGICAL INNOVATION: How scientific advances and technical capabilities shaped creative possibilities
2. BUSINESS/INDUSTRIAL TRANSFORMATION: How economic forces, corporate strategies, and market dynamics drove industry development

The entire analysis should demonstrate how cinema evolved "from scientific curiosity to industrialized art form" through the interplay of technological capability and business innovation.

WRITING OBJECTIVE (Your Story's Central Thread):
{section_data['main_argument']}

PARADIGMATIC INTEGRATION FOR THIS SECTION:
- Technology Dimension: {self._get_tech_paradigm_focus(roman_numeral)}
- Business Dimension: {self._get_business_paradigm_focus(roman_numeral)}

TARGET LENGTH: {section_data['estimated_words']} words

NARRATIVE APPROACH FOR THIS SECTION:
{template_data['prompt_template']} - Remember: tell this as a story while maintaining scholarly accuracy

TONE: {template_data['tone_instructions']} - but filtered through engaging storytelling and humanizing guidelines

SECTION STORY ARC:
{section_data['outline']}

EVIDENCE REQUIREMENTS (Your Source Material):
{evidence_req['required_evidence']}

SOURCE SYNTHESIS APPROACH:
{evidence_req['comprehensive_query']}

DATA SOURCE STRATEGY:
- COMPREHENSIVE DOCUMENT ACCESS: Query ALL document buckets for maximum source diversity and evidence depth
- TARGETED SQL DATA: Use specific tables selected for this section's analytical needs and structural requirements
- PARADIGMATIC ANALYSIS: Frame all evidence through the technology/business lens that defines this textbook's approach

ACADEMIC STANDARDS WITH ENGAGING STORYTELLING:
- Use Chicago citation style for film history, integrated naturally into prose flow
- Include specific dates, names, and technical details as concrete evidence - FACTUAL ACCURACY IS ESSENTIAL
- Balance primary and secondary sources across ALL available document collections
- Write as a knowledgeable professor sharing a compelling true story, following all humanizing guidelines
- Create smooth, natural transitions that advance the narrative
- Leverage both broad source knowledge and specific structural data
- CONSISTENTLY apply the technology/business paradigmatic framework throughout
- Write sentences that average 10-20 words, use active voice 90% of the time
- Choose concrete, specific words over abstract terminology
- Avoid all banned phrases and complex sentence structures listed in the guidelines

STORY FLOW REQUIREMENTS:
Builds on: {section_data['builds_on_previous']}
Sets up: {section_data['sets_up_next']}
Transition strategy: {section_data['transition_notes']}

CRITICAL WRITING REQUIREMENTS:
- Every sentence must comply with the humanizing writing guidelines
- Use straightforward punctuation (periods, commas, question marks, occasional colons)
- Avoid all banned words and phrases completely
- Write in natural, conversational storytelling voice with varied paragraph lengths
- State facts directly without hedging or corporate jargon
- Use concrete details and specific examples before abstract concepts
- MAINTAIN FACTUAL ACCURACY - never sacrifice truth for narrative flow
- Remember: scholarly restraint with engaging narrative warmth
- The story should feel like it's unfolding, not being reported

FINAL INSTRUCTION:
Write Section {roman_numeral} as a complete, standalone section that tells this part of the story while flowing naturally from previous content and setting up the next section. Draw from ALL available document sources while using targeted table data for structure and specific requirements. Include proper academic citations, historical evidence, and analysis. 

Tell this story as if you're sharing this fascinating true narrative with a colleague who trusts your expertise - make them feel like they're discovering this history alongside you. MOST IMPORTANTLY: Frame all content through the paradigmatic lens of technology and business as the driving forces of American cinema development, while following every humanizing writing guideline and maintaining absolute factual accuracy. The goal is an engaging, true story that happens to be scholarly, not a scholarly text that happens to be engaging.
"""

        # Get relevant buckets and tables using your existing structure
        relevant_buckets = self._get_relevant_buckets(roman_numeral)
        relevant_tables = self._get_relevant_tables(roman_numeral)

        print(f"[ACADEMIC] Section {roman_numeral} will use:")
        print(f"  - Buckets: {relevant_buckets}")
        print(f"  - Tables: {relevant_tables}")
        print(f"  - Instructions: {len(academic_instructions)} chars")
        print(f"  - Humanized writing guidelines: ACTIVE")

        # Return request compatible with your existing writing system
        return {
            "project_id": self.project_name,
            "prompt_tone": "academic_humanized",
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
        """Assemble complete chapter from sections with humanized introduction"""
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

        # Create properly formatted academic chapter with paradigmatic framing and humanized introduction
        chapter_header = f"""# Chapter {chapter_num}: The Birth of an Industry
## American Cinema from Invention to Hollywood's Rise (1890s–1915)

### A Paradigmatic Perspective of The History of American Film

This chapter examines the foundational period of American cinema through two connected lenses: **technological innovation** and **business transformation**. Rather than viewing early cinema as separate developments, this approach reveals how the combination of scientific advancement and commercial enterprise drove motion pictures to evolve from scientific curiosity to industrialized art form.

The technological dimension covers the scientific experiments, patent developments, and technical innovations that made cinema possible. This includes Muybridge's motion studies, Edison's Kinetoscope, and the Lumière Cinématographe. The business dimension examines how entrepreneurs, inventors, and financiers transformed these technological capabilities into sustainable commercial enterprises. This process created the industrial foundation for Hollywood's emergence.

This dual approach demonstrates that American cinema's development was neither purely artistic nor merely technical. Instead, it was shaped by the dynamic relationship between technological possibility and economic opportunity.

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
                prompt="Academic textbook chapter generation with humanized writing guidelines",
                result=content,
                metadata_json={
                    "chapter_number": chapter_num,
                    "total_sections": section_count,
                    "total_words": total_words,
                    "generation_type": "academic_chapter",
                    "writing_style": "humanized_academic"
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
                "main_argument": "Early cinema emerged from scientific experimentation and Victorian fascination with motion, establishing both the technological foundation and commercial potential for narrative filmmaking through the intersection of laboratory innovation and entrepreneurial investment",
                "estimated_words": 1200,
                "builds_on_previous": "None - opening section that establishes the technology/business framework",
                "sets_up_next": "Technological competition and business model rivalry between Edison and Lumière",
                "transition_notes": "End with the stage set for commercial competition between competing technological and business approaches",
                "outline": "Late 19th-century scientific workshops as sites of commercial potential; Victorian fascination with motion as market opportunity; Muybridge motion studies and Marey chronophotography as technological/business foundation; Laboratory experiments attracting entrepreneurial capital and patent investment"
            },
            "II": {
                "title": "The Race to Invent: Competing Models of Cinema",
                "main_argument": "Edison's individual viewing model and Lumière's communal projection established competing technological and business approaches that shaped early film exhibition, demonstrating how technical capabilities and revenue models evolved together",
                "estimated_words": 1500,
                "builds_on_previous": "Scientific/commercial foundation from Section I",
                "sets_up_next": "Content development driven by technological capabilities and business opportunities",
                "transition_notes": "Connect technological capabilities to content possibilities and business implications",
                "outline": "A. Edison's Kinetoscope: individual viewing technology and arcade/parlor business model, Black Maria studio as controlled production environment. B. Lumière Cinématographe: projection technology and public screening revenue model, Paris exhibitions establishing communal viewing business"
            },
            "III": {
                "title": "Early Content: From Actuality to Narrative Stirrings",
                "main_argument": "Early films evolved from scientific curiosities to entertainment spectacles through the intersection of technological capabilities and market demands, with cultural controversies revealing cinema's emerging social and economic impact",
                "estimated_words": 1100,
                "builds_on_previous": "Exhibition models and business strategies from Section II",
                "sets_up_next": "Porter's technological and commercial narrative innovations",
                "transition_notes": "Show how audience demand and revenue opportunities drove technological sophistication in storytelling",
                "outline": "Actuality films as technological demonstration and vaudeville business integration; *The Kiss* controversy revealing cinema's cultural and economic power; Early audience reception driving technological and commercial evolution toward narrative entertainment"
            },
            "IV": {
                "title": "The Dawn of American Narrative: Edwin S. Porter",
                "main_argument": "Porter's *The Great Train Robbery* represents the breakthrough where technological innovation (editing techniques) merged with commercial insight (narrative appeal) to establish American cinema's industrial foundation",
                "estimated_words": 1600,
                "builds_on_previous": "Market demand for sophisticated content and technological possibilities from Section III",
                "sets_up_next": "Mass audience business model enabled by narrative technology",
                "transition_notes": "Establish Porter's innovations as enabling the business transformation to mass entertainment",
                "outline": "Porter's position at Edison studios linking technological capability with commercial production; Analysis of *The Great Train Robbery* as technological breakthrough (editing, cross-cutting) and business innovation (narrative engagement); Impact on American film development through integration of technical and commercial advancement"
            },
            "V": {
                "title": "The Nickelodeon Boom and the New Mass Audience",
                "main_argument": "The nickelodeon phenomenon shows the transformation where technological accessibility (projection standardization) combined with business innovation (low-price/high-volume model) to create America's first mass entertainment industry",
                "estimated_words": 1800,
                "builds_on_previous": "Porter's narrative technology and commercial breakthrough",
                "sets_up_next": "Industrial consolidation attempts driven by technological control and business monopolization",
                "transition_notes": "Connect individual innovation to industry-wide technological and business transformation",
                "outline": "Nickelodeon emergence through technological standardization and business model innovation; Working-class and immigrant audiences as new market created by technological accessibility; Economic impact through intersection of technical distribution and commercial exhibition; Cultural significance as technological democracy enabling business expansion"
            },
            "VI": {
                "title": "Industrialization and Monopoly: The Motion Picture Patents Company",
                "main_argument": "The MPPC represented the attempt at industrial monopoly through technological control (patent consolidation) and business integration (vertical control), demonstrating how technological ownership became connected to commercial dominance",
                "estimated_words": 1500,
                "builds_on_previous": "Mass audience business model and technological distribution from Section V",
                "sets_up_next": "Independent resistance through technological and geographical business innovation",
                "transition_notes": "Show tension between technological/business consolidation and creative/entrepreneurial independence",
                "outline": "MPPC formation through merger of patent technology and business strategy; Edison's leadership in technological control and commercial monopolization; Vertical integration demonstrating technological ownership as business power; Impact on production and distribution through suppression of technological and commercial innovation"
            },
            "VII": {
                "title": "Resistance and Relocation: The Independents and the Rise of Hollywood",
                "main_argument": "Independent producers' resistance shows the principle that technological innovation and business entrepreneurship overcome monopolistic control, with geographical relocation enabling both technical freedom and commercial innovation",
                "estimated_words": 1700,
                "builds_on_previous": "MPPC technological and business monopoly attempt from Section VI",
                "sets_up_next": "Dissolution of monopolistic control and establishment of competitive technological and business environment",
                "transition_notes": "Connect resistance to monopoly with geographic and technological transformation enabling business innovation",
                "outline": "Independent producers demonstrating entrepreneurship through technological and business resistance; Geographical relocation to California as technological advantage (climate, geography) and business strategy (legal independence); Hollywood's emergence through integration of technological capability and commercial innovation; Star system development as technological (performance) and business (marketing) advancement"
            },
            "VIII": {
                "title": "The Fall of the Trust and the Dawn of a New Era",
                "main_argument": "The dissolution of the MPPC and rise of legitimate Hollywood studios demonstrates the principle that sustainable industry development requires the integration of technological innovation with competitive business practices, marking cinema's transition from experimental monopoly to established democratic industry",
                "estimated_words": 1600,
                "builds_on_previous": "Independent technological and business resistance establishing Hollywood from Section VII",
                "sets_up_next": "Future American film industry development through continued technological and business evolution",
                "transition_notes": "Provide closure while establishing framework for continued technological and business development",
                "outline": "MPPC legal challenges and dissolution as victory of competitive innovation over monopolistic control; Rise of major studios through technological standardization and business legitimization; Industry establishment through integration of technological professionalism and commercial sustainability; Setting stage for Golden Age development through continued technological and business advancement"
            }
        }
        return details.get(roman_numeral, details["I"])

    def _get_section_template(self, roman_numeral: str) -> Dict[str, str]:
        templates = {
            "I": {
                "prompt_template": "Write as an engaging academic introduction that establishes historical context and technological foundations. Use chronological progression and emphasize the scientific/experimental nature of early motion picture development. Write in clear, accessible prose.",
                "tone_instructions": "Scholarly but accessible, with emphasis on wonder and innovation of the period. Use concrete examples and avoid abstract terminology."
            },
            "II": {
                "prompt_template": "Present as a comparative analysis of competing technologies and business models. Structure around the Edison vs. Lumière rivalry while explaining technical innovations clearly using simple, direct language.",
                "tone_instructions": "Analytical and comparative, explaining technical concepts for non-technical readers using everyday vocabulary"
            },
            "III": {
                "prompt_template": "Trace the evolution from documentary to narrative forms. Emphasize audience reception and cultural impact of early films using concrete details and specific examples.",
                "tone_instructions": "Cultural analysis tone, connecting films to broader social contexts with clear, straightforward explanations"
            },
            "IV": {
                "prompt_template": "Focus on Porter as a pivotal figure in American narrative development. Analyze *The Great Train Robbery* as a case study in early storytelling innovation using specific details and clear explanations.",
                "tone_instructions": "Biographical and analytical, emphasizing innovation and American cinema development with accessible academic prose"
            },
            "V": {
                "prompt_template": "Examine the nickelodeon phenomenon as a social and economic transformation. Connect technological innovation to mass culture development using concrete examples and clear explanations.",
                "tone_instructions": "Social historical analysis, emphasizing demographic change and cultural accessibility with straightforward academic writing"
            },
            "VI": {
                "prompt_template": "Present the MPPC as an early example of media monopolization. Analyze business strategies and their impact on creative development using clear, direct language.",
                "tone_instructions": "Business and legal analysis, explaining complex corporate strategies clearly without jargon"
            },
            "VII": {
                "prompt_template": "Tell the story of independent resistance and geographical shift as entrepreneurial innovation. Emphasize Hollywood's emergence as an industry center using concrete details and clear narrative.",
                "tone_instructions": "Narrative of entrepreneurial resistance and geographical transformation told in accessible academic prose"
            },
            "VIII": {
                "prompt_template": "Conclude with the transition from experimental medium to established industry. Synthesize themes while preparing for future developments using clear, direct language.",
                "tone_instructions": "Synthesizing and forward-looking, providing closure while maintaining scholarly momentum through accessible writing"
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
            "II": "Competing technological approaches - Edison's individual viewing (Kinetoscope) vs. Lumière's communal projection (Cinématographe), celluloid film stock standardization",
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

    print(f"🎬 Testing Academic Chapter Generation with Humanized Writing")
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

        print(f"✍️ Humanized writing guidelines: ACTIVE")
        print(f"📝 Natural academic prose with concrete details and accessible language")

        result = await generator.generate_complete_chapter(chapter_num=1)

        print(f"\n🎉 Generation completed successfully!")
        print(f"📊 Generated {result['metadata']['total_words']:,} words")
        print(f"📝 Sections: {result['metadata']['sections_generated']}/{result['metadata']['sections_generated'] + result['metadata']['sections_failed']}")
        print(f"✍️ Writing style: Humanized academic prose")

        # Save to markdown file as well
        output_path = f"projects/{project_name}/Chapter_1_Humanized_Generated.md"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result['content'])
        print(f"📁 Also saved to: {output_path}")

        return result

    except Exception as e:
        print(f"❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return None

# Example: Simple test with default configuration and humanized writing
async def test_simple_humanized_generation():
    """Simple test with default table mapping and humanized writing guidelines"""
    generator = AcademicChapterGenerator("textbook_pilot")
    return await generator.generate_complete_chapter()

if __name__ == "__main__":
    # Test with your existing textbook_pilot project using humanized writing
    import asyncio
    asyncio.run(test_academic_generation())
