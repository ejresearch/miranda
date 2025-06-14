from lightrag import LightRAG
from lightrag.llm.openai import gpt_4o_mini_complete, openai_embed

# ✅ Singleton instance (created once)
_lightrag = LightRAG(
    working_dir="./lightrag_working_dir",
    embedding_func=openai_embed,
    llm_model_func=gpt_4o_mini_complete
)

# ✅ Accessor function (import this safely anywhere)
def get_lightrag():
    return _lightrag

