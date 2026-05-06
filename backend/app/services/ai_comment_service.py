import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# 🔥 FIX: match your installed model
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


async def generate_ai_comment(
    blog_title: str,
    blog_content: str,
    author_name: str,
) -> Optional[str]:

    prompt = (
        f'A user named "{author_name}" just published a blog post.\n\n'
        f"Title: {blog_title}\n"
        f"Content:\n{blog_content[:1500]}\n\n"
        "Write a single friendly comment (3–5 sentences) that:\n"
        "1. Praises one specific strength of the post.\n"
        "2. Gives one actionable suggestion.\n"
        "3. Ends with encouragement.\n\n"
        "Do NOT start with 'Great post!'. Output only the comment."
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
            )

            response.raise_for_status()

            text = response.json().get("response", "").strip()

            if not text:
                logger.warning("Empty response from Ollama")
                return None

            return text

    except httpx.ConnectError:
        logger.error("❌ Ollama not running at %s", OLLAMA_BASE_URL)
        return None

    except Exception as e:
        logger.error("❌ Ollama error: %s", e)
        return None