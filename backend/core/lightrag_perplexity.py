# backend/core/lightrag_perplexity.py - NEW FILE FOR PERPLEXITY INTEGRATION

import os
import asyncio
import httpx
from typing import Dict, Any, List
from lightrag import LightRAG
from lightrag.utils import logger

# Initialize LightRAG logging
logger.info("Loading Perplexity integration module")

async def perplexity_model_if_cache(
    prompt: str,
    model: str = "llama-3.1-sonar-large-128k-online",
    system_prompt: str = None,
    history_messages: List[Dict] = None,
    **kwargs
) -> str:
    """
    Generate content using Perplexity API with caching support
    """
    try:
        # Get API key from environment
        api_key = os.getenv("PERPLEXITY_API_KEY")
        if not api_key:
            raise ValueError("PERPLEXITY_API_KEY not found in environment")
        
        # Build messages array
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        if history_messages:
            messages.extend(history_messages)
        
        messages.append({"role": "user", "content": prompt})
        
        # Prepare request payload
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": kwargs.get("max_tokens", 2000),
            "temperature": kwargs.get("temperature", 0.7),
        }
        
        # Make API request
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                error_msg = f"Perplexity API error {response.status_code}: {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            logger.info(f"Perplexity generation successful: {len(content)} characters")
            return content
            
    except Exception as e:
        logger.error(f"Perplexity API call failed: {str(e)}")
        raise

def create_perplexity_lightrag(working_dir: str) -> LightRAG:
    """
    Create LightRAG instance configured for Perplexity
    """
    try:
        from lightrag.llm import openai_embedding
        
        # Use Perplexity for text generation, OpenAI for embeddings (cheaper)
        rag = LightRAG(
            working_dir=working_dir,
            llm_model_func=perplexity_model_if_cache,
            llm_model_name="llama-3.1-sonar-large-128k-online",
            llm_model_max_async=4,
            llm_model_kwargs={
                "model": "llama-3.1-sonar-large-128k-online",
                "max_tokens": 2000,
                "temperature": 0.7
            },
            embedding_func=openai_embedding,
            embedding_model_name="text-embedding-3-small"
        )
        
        logger.info("Created LightRAG instance with Perplexity integration")
        return rag
        
    except Exception as e:
        logger.error(f"Failed to create Perplexity LightRAG instance: {str(e)}")
        raise

def is_perplexity_available() -> bool:
    """
    Check if Perplexity is properly configured
    """
    api_key = os.getenv("PERPLEXITY_API_KEY")
    use_perplexity = os.getenv("USE_PERPLEXITY", "false").lower() == "true"
    
    return bool(api_key) and use_perplexity

async def test_perplexity_connection() -> bool:
    """
    Test Perplexity API connection
    """
    try:
        response = await perplexity_model_if_cache(
            "Hello, this is a test message. Please respond with 'Connection successful.'",
            max_tokens=50
        )
        return "successful" in response.lower()
    except Exception as e:
        logger.error(f"Perplexity connection test failed: {str(e)}")
        return False
