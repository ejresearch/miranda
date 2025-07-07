# backend/api/academic/simplified_chapter_generator_fixed.py
import os
import sqlite3
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import your existing systems (matching the working script)
from backend.api.writing.logic import generate_written_output
from backend.api.project_versions import save_version_to_db

class AcademicChapterGenerator:
    """
    Fixed simplified academic chapter generator that works with your existing infrastructure
    - Uses the same backend systems as the working script
    - Maintains the simplified college-level approach
    - Fixed imports and error handling
    - Works with your repository structure
    """

    # College-level teaching guidelines (same as simplified version)
    CORE_WRITING_GUIDELINES = """
COLLEGE TEXTBOOK TEACHING GUIDELINES:

EDUCATIONAL DISCOVERY APPROACH:
• Identify the most important people, innovations, and developments from sources
• Explain WHY each topic matters to understanding cinema history
• Teach concepts by building from concrete examples to broader principles
• Help students see patterns and connections across the period

COLLEGE-LEVEL PEDAGOGY:
• Assume intelligent students who need context and explanation, not just facts
• Define technical terms and historical context clearly
• Use engaging examples that illustrate larger concepts
• Balance detail with accessibility - scholarly but not intimidating

TEACHING STRUCTURE:
• Start with concrete examples students can visualize
• Explain the significance and broader implications
• Connect individual innovations to industry-wide changes
• Show cause-and-effect relationships clearly

DISCOVERY PRINCIPLES:
1. FIND THE MOST IMPORTANT FIGURES: Who were the key innovators and decision-makers?
2. IDENTIFY BREAKTHROUGH MOMENTS: What innovations changed everything?
3. EXPLAIN TECHNOLOGICAL EVOLUTION: How did technical capabilities advance?
4. ANALYZE BUSINESS TRANSFORMATION: How did economic models evolve?
5. SHOW CULTURAL IMPACT: How did cinema change American society?

WRITING FOR COLLEGE STUDENTS:
• Use clear, engaging prose that maintains academic rigor
• Include specific dates, names, and technical details as learning anchors
• Explain complex concepts through familiar comparisons when helpful
• Ask implicit questions students might have and answer them
• Build knowledge progressively - each section prepares for the next

AVOID TEXTBOOK PITFALLS:
• Don't just list facts - explain their significance
• Don't assume prior knowledge - build understanding step by step
• Don't oversimplify - maintain intellectual rigor appropriate for college level
• Don't lose the human stories in technical or business details
"""

    # Chapter sections with learning objectives
    CHAPTER_SECTIONS = {
        "I": {
            "title": "The Scientific Dream of Living Pictures",
            "learning_objective": "Students will discover how scientific curiosity about motion became the foundation for a new art form and industry",
            "word_target": 1200,
            "key_questions": [
                "Who were the scientists and inventors experimenting with capturing motion?",
                "What technical breakthroughs made motion pictures possible?", 
                "How did scientific experiments attract commercial investment?",
                "Why did Victorian society become fascinated with motion studies?"
            ]
        },
        "II": {
            "title": "The Race to Invent: Competing Visions",
            "learning_objective": "Students will understand how different inventors created competing technologies and business models for exhibiting motion pictures",
            "word_target": 1500,
            "key_questions": [
                "What were the key differences between Edison's and the Lumière brothers' approaches?",
                "How did technical capabilities shape early business models?",
                "Why did projection ultimately triumph over individual viewing devices?",
                "How did international competition drive innovation?"
            ]
        },
        "III": {
            "title": "From Science to Entertainment",
            "learning_objective": "Students will analyze how motion pictures evolved from scientific demonstrations to popular entertainment",
            "word_target": 1100,
            "key_questions": [
                "What types of films did early producers make and why?",
                "How did audience reactions shape content development?", 
                "What role did existing entertainment venues play in cinema's growth?",
                "How did early films challenge social norms and values?"
            ]
        },
        "IV": {
            "title": "Edwin S. Porter and the Birth of American Storytelling",
            "learning_objective": "Students will examine how individual innovation created the foundation for narrative cinema",
            "word_target": 1600,
            "key_questions": [
                "Who was Edwin S. Porter and what made him significant?",
                "How did 'The Great Train Robbery' change American filmmaking?",
                "What technical innovations enabled more sophisticated storytelling?",
                "Why did narrative films prove more commercially successful?"
            ]
        },
        "V": {
            "title": "The Nickelodeon Revolution",
            "learning_objective": "Students will explore how technological accessibility and smart business models created America's first mass entertainment medium",
            "word_target": 1800,
            "key_questions": [
                "How did nickelodeons make movies accessible to working-class Americans?",
                "What business innovations made five-cent theaters profitable?",
                "How did immigrant entrepreneurs shape the industry?",
                "What was cinema's impact on urban social life?"
            ]
        },
        "VI": {
            "title": "The Trust: Hollywood's First Monopoly Attempt", 
            "learning_objective": "Students will analyze how the Motion Picture Patents Company tried to control the industry through technology and legal power",
            "word_target": 1500,
            "key_questions": [
                "What was the Motion Picture Patents Company and how did it operate?",
                "How did patent pooling create industry control?",
                "What were the Trust's strengths and weaknesses as a business strategy?",
                "How did the MPCC attempt to standardize film content and exhibition?"
            ]
        },
        "VII": {
            "title": "The Independents Fight Back",
            "learning_objective": "Students will discover how entrepreneurial resistance and geographic relocation created modern Hollywood",
            "word_target": 1700,
            "key_questions": [
                "Who were the key independent producers and what strategies did they use?",
                "Why did many film companies relocate to California?", 
                "How did the star system emerge as a business innovation?",
                "What competitive advantages did independents develop?"
            ]
        },
        "VIII": {
            "title": "The End of the Trust Era",
            "learning_objective": "Students will understand how legal, economic, and creative forces transformed cinema into a legitimate industry",
            "word_target": 1600,
            "key_questions": [
                "How and why did the Motion Picture Patents Company collapse?",
                "What role did government antitrust action play?",
                "How did the studio system emerge from the Trust's failure?",
                "What patterns established in this period shaped Hollywood's future?"
            ]
        }
    }

    def __init__(self, project_name: str):
        self.project_name = project_name
        self.project_path = f"projects/{project_name}"
        self.db_path = f"{self.project_path}/project.db"
        # Fixed: Use the correct lightrag path from your working script
        self.lightrag_path = "backend/lightrag_working_dir"

    def validate_project(self):
        """Validate project exists and has required structure"""
        if not os.path.exists(self.project_path):
            raise FileNotFoundError(f"Project directory not found: {self.project_path}")

        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Project database not found: {self.db_path}")

        print(f"[ACADEMIC] ✅ Project validated: {self.project_name}")

    async def generate_complete_chapter(self, chapter_num: int = 1) -> Dict[str, Any]:
        """Generate complete academic chapter using your existing infrastructure"""
        self.validate_project()
        self._setup_academic_tables()
        
        print(f"📚 Generating Chapter {chapter_num}: The Birth of an Industry")
        print(f"📁 Project: {self.project_name}")
        print(f"🗄️ Database: {self.db_path}")
        print("=" * 60)

        sections_data = []
        total_words = 0
        generation_log = []

        # Generate each section using your existing writing system
        for i, (roman_numeral, section_info) in enumerate(self.CHAPTER_SECTIONS.items(), 1):
            section_title = section_info['title']
            print(f"\n📝 [{i}/{len(self.CHAPTER_SECTIONS)}] Generating Section {roman_numeral}: {section_title}")

            try:
                # Build section-specific write request using your existing structure
                write_request = await self._build_write_request(chapter_num, roman_numeral, section_info)

                # Use your existing generate_written_output function
                print(f"[ACADEMIC] Calling your existing writing system...")
                result = await generate_written_output(**write_request)

                if result.get("status") == "success":
                    section_content = result.get("result", "")
                    word_count = len(section_content.split())

                    # Save section using your database structure
                    section_data = self._save_section(
                        chapter_num,
                        self._roman_to_number(roman_numeral),
                        section_title,
                        section_content,
                        section_info['learning_objective'],
                        result.get("version_id")
                    )

                    sections_data.append(section_data)
                    total_words += word_count

                    print(f"✅ Section {roman_numeral} completed ({word_count:,} words)")
                    print(f"📝 {section_info['learning_objective']}")

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
        complete_chapter = self._assemble_complete_chapter(chapter_num, sections_data)

        # Save complete chapter using your version system
        chapter_metadata = self._save_complete_chapter(chapter_num, complete_chapter, len(sections_data))

        print(f"\n🎉 Chapter {chapter_num} Generation Complete!")
        print(f"📊 Total: {len(sections_data)} sections, {total_words:,} words")
        print(f"💾 Saved to: {self.db_path}")

        return {
            "status": "success",
            "project_name": self.project_name,
            "chapter_number": chapter_num,
            "chapter_title": "The Birth of an Industry",
            "content": complete_chapter,
            "metadata": {
                "total_words": total_words,
                "sections_generated": len(sections_data),
                "sections_failed": len(generation_log),
                "average_words_per_section": total_words // len(sections_data) if sections_data else 0,
                "project_path": self.project_path,
                "database_path": self.db_path
            },
            "sections": sections_data + generation_log,
            "generation_timestamp": datetime.now().isoformat()
        }

    async def _build_write_request(self, chapter_num: int, roman_numeral: str, section_info: Dict) -> Dict[str, Any]:
        """Build writing request compatible with your existing backend/api/writing/logic.py"""
        
        learning_objective = section_info.get('learning_objective', '')
        key_questions = section_info.get('key_questions', [])
        word_target = section_info.get('word_target', 1200)

        # Create comprehensive academic instructions focused on discovery
        academic_instructions = f"""
{self.CORE_WRITING_GUIDELINES}

ACADEMIC TEXTBOOK SECTION: {section_info['title']}

TECHNOLOGY & BUSINESS PARADIGM:
This chapter examines American cinema evolution through the interplay of:
1. TECHNOLOGICAL INNOVATION: Scientific advances and technical capabilities that made cinema possible
2. BUSINESS TRANSFORMATION: Economic forces and entrepreneurial strategies that drove industry development

Your analysis should demonstrate how cinema evolved "from scientific curiosity to industrialized art form" through these connected forces.

TEACHING OBJECTIVE:
{learning_objective}

SECTION TO TEACH: {section_info['title']}
TARGET LENGTH: {word_target} words

KEY QUESTIONS TO EXPLORE AND ANSWER:
{chr(10).join(f"• {q}" for q in key_questions)}

DISCOVERY APPROACH FOR THIS SECTION:
Your job is to DISCOVER and TEACH the most important topics from the available document sources. Help students understand:

1. WHO were the key figures and WHY do they matter to cinema history?
2. WHAT were the major innovations and breakthroughs?
3. HOW did technology and business evolve together?
4. WHERE did important developments happen and why?
5. WHEN did crucial changes occur and what caused them?

COLLEGE-LEVEL TEACHING STRATEGY:
• Start with engaging examples that students can visualize
• Explain the broader significance of each innovation or development
• Show cause-and-effect relationships clearly
• Define technical terms and provide historical context
• Use primary source evidence from documents to support your teaching
• Build toward understanding larger patterns and transformations

PARADIGMATIC INTEGRATION:
Frame all content through the technology/business paradigm:
- Show how technical innovations enabled new business opportunities
- Demonstrate how business needs drove technological development
- Connect individual inventions to industry-wide transformations
- Reveal the dynamic relationship between scientific capability and commercial enterprise

WRITING FOR STUDENT LEARNING:
• Use clear, engaging prose that maintains intellectual rigor
• Include specific examples, dates, and details as learning anchors
• Explain WHY things happened, not just WHAT happened
• Help students see connections between different aspects (technology, business, culture)
• Anticipate questions students might have and address them
• Make abstract concepts concrete through specific examples

Write this section as a complete, standalone piece that flows naturally and teaches students about this crucial period in cinema history. Draw from ALL available document sources while maintaining the technology/business analytical framework throughout.
"""

        # Get relevant buckets and tables using the same approach as your working script
        relevant_buckets = self._get_relevant_buckets(roman_numeral)
        relevant_tables = self._get_relevant_tables(roman_numeral)

        print(f"[ACADEMIC] Section {roman_numeral} will use:")
        print(f"  - Buckets: {relevant_buckets}")
        print(f"  - Tables: {relevant_tables}")
        print(f"  - Instructions: {len(academic_instructions)} chars")
        print(f"  - College-level educational approach: ACTIVE")

        # Return request compatible with your existing writing system
        return {
            "project_id": self.project_name,
            "prompt_tone": "educational",
            "custom_instructions": academic_instructions,
            "selected_buckets": relevant_buckets,
            "selected_tables": relevant_tables,
            "brainstorm_version_ids": []
        }

    def _get_relevant_buckets(self, roman_numeral: str) -> List[str]:
        """Get ALL academic buckets for comprehensive source access (same as working script)"""
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
                    return existing_buckets
                else:
                    print(f"[ACADEMIC] No existing buckets found, using all intended academic buckets for Section {roman_numeral}")
                    return academic_buckets
            else:
                print(f"[ACADEMIC] LightRAG directory not found, using intended academic buckets for Section {roman_numeral}")
                return academic_buckets

        except Exception as e:
            print(f"[WARNING] Could not verify buckets: {e}")
            return academic_buckets

    def _get_relevant_tables(self, roman_numeral: str) -> List[str]:
        """Get tables that exist in the database (simplified approach)"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            existing_tables = [row[0] for row in cursor.fetchall()]
            conn.close()

            # Filter to film history related tables
            relevant_tables = [table for table in existing_tables
                             if any(keyword in table.lower() for keyword in ['film_history', 'markdown_outline', 'sections', 'evidence'])]

            print(f"[ACADEMIC] Section {roman_numeral} using available tables: {relevant_tables}")
            return relevant_tables

        except Exception as e:
            print(f"[WARNING] Could not verify tables: {e}")
            return []

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

    def _assemble_complete_chapter(self, chapter_num: int, sections_data: List[Dict]) -> str:
        """Assemble complete chapter from sections with educational framework"""
        header = f"""# Chapter {chapter_num}: The Birth of an Industry
## American Cinema from Invention to Hollywood's Rise (1890s–1915)

### For Students: What You'll Learn in This Chapter

This chapter tells the story of how motion pictures evolved from scientific experiments to America's dominant entertainment industry in just 25 years. You'll discover the key innovators, breakthrough technologies, and business strategies that created modern cinema.

**Essential Questions to Consider:**
- How did scientific curiosity about motion become a multi-million dollar industry?
- What role did competition and conflict play in shaping early cinema?
- How did technological innovations and business models evolve together?
- Why did Hollywood emerge as the center of American filmmaking?
- What patterns established in this period continue to influence entertainment today?

**Learning Framework:**
This chapter examines cinema's development through the interplay of:
1. **Technological Innovation** - How scientific advances enabled new creative possibilities
2. **Business Transformation** - How entrepreneurs turned innovations into profitable industries

---

"""
        
        sections_content = []
        for section in sections_data:
            sections_content.append(f"## {section['title']}\n\n{section['full_content']}")
        
        # Add educational conclusion
        conclusion = f"""

---

## Chapter Summary: Understanding the Transformation

### What Students Should Take Away

By 1915, American cinema had transformed from scientific curiosity to mass entertainment industry through the dynamic relationship between technological innovation and business opportunity.

**Key Technological Developments:**
- Motion photography techniques (Muybridge, Marey)
- Projection systems (Edison Kinetoscope vs. Lumière Cinématographe) 
- Narrative editing techniques (Porter's innovations)
- Standardized production methods

**Key Business Innovations:**
- Individual vs. communal viewing models
- Nickelodeon low-price/high-volume strategy
- Patent consolidation and monopoly attempts
- Independent resistance and geographic relocation

### Patterns That Continue Today

The developments you studied establish patterns still visible in entertainment:
- Technology and business strategy evolve together
- Competition drives innovation and creativity
- Geographic concentration creates industry centers
- Independent creators challenge established systems

Understanding these foundational patterns helps explain how entertainment industries develop and adapt to new challenges and opportunities.
"""
        
        return header + "\n\n".join(sections_content) + conclusion

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
                prompt="Simplified academic textbook generation with college-level pedagogy",
                result=content,
                metadata_json={
                    "chapter_number": chapter_num,
                    "total_sections": section_count,
                    "total_words": total_words,
                    "generation_type": "academic_chapter",
                    "writing_style": "college_educational"
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

    def _roman_to_number(self, roman: str) -> int:
        roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
        return roman_map.get(roman, 1)

    def _number_to_roman(self, num: int) -> str:
        number_map = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII"}
        return number_map.get(num, "I")


# Test function for your textbook_pilot project (same as working script)
async def test_simplified_generation():
    """Test the fixed simplified academic generation with your existing textbook_pilot project"""
    project_name = "textbook_pilot"

    print(f"🎬 Testing Fixed Simplified Academic Chapter Generation")
    print(f"📁 Project: {project_name}")
    print("=" * 50)

    try:
        generator = AcademicChapterGenerator(project_name)

        print(f"✍️ Style: College-level educational approach")
        print(f"📝 Framework: Technology & Business paradigm")

        result = await generator.generate_complete_chapter(chapter_num=1)

        print(f"\n🎉 Generation completed successfully!")
        print(f"📊 Generated {result['metadata']['total_words']:,} words")
        print(f"📝 Sections: {result['metadata']['sections_generated']}")
        print(f"✍️ Writing style: Simplified but rigorous academic")

        # Save to markdown file as well
        output_path = f"projects/{project_name}/Chapter_1_Simplified_Fixed.md"
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
    asyncio.run(test_simplified_generation())
