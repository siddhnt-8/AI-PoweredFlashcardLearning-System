"""
services/ai_processor.py — Generate flashcards via MiMo-v2-Flash (OpenRouter).

Uses LangChain's ChatOpenAI with a custom base_url pointing to OpenRouter.

Public API:
  generate_flashcards(text, mode, card_count) -> list[dict]
"""

import json
import re

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

from config import settings
from models import GenerationMode
from services.pdf_extractor import truncate_text


# ---------------------------------------------------------------------------
# LLM instance — MiMo-v2-Flash via OpenRouter
# ---------------------------------------------------------------------------
llm = ChatOpenAI(
    api_key=settings.openai_api_key,
    temperature=settings.llm_temperature,
    model=settings.llm_model,                   # xiaomi/mimo-v2-flash
    base_url=settings.llm_base_url,             # https://openrouter.ai/api/v1
    max_tokens=settings.llm_max_tokens,
)


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_QUESTIONS = """\
You are an expert educator and flashcard creator.
Your task is to generate concise, high-quality question-answer flashcards \
from the provided text.

Rules:
- Return ONLY a valid JSON array — no explanation, no markdown, no preamble.
- Each item must follow this exact schema:
  {{"type": "question", "front": "<question>", "back": "<answer>"}}
- Questions should be clear, specific, and test real understanding.
- Answers should be concise (1–3 sentences max).
- Do NOT include any text outside the JSON array.
"""

SYSTEM_PROMPT_NOTES = """\
You are an expert educator and summariser.
Your task is to generate concise short-note flashcards from the provided text.

Rules:
- Return ONLY a valid JSON array — no explanation, no markdown, no preamble.
- Each item must follow this exact schema:
  {{"type": "note", "front": "<topic title>", "back": "<concise explanation>"}}
- Titles should be short (3–6 words).
- Explanations should be clear and self-contained (2–4 sentences max).
- Do NOT include any text outside the JSON array.
"""

USER_PROMPT_TEMPLATE = """\
Generate exactly {card_count} flashcards from the following text.

TEXT:
\"\"\"
{text}
\"\"\"

Remember: respond ONLY with a valid JSON array of {card_count} flashcard objects.
"""


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------
async def generate_flashcards(
    text:       str,
    mode:       GenerationMode,
    card_count: int = 10,
) -> list[dict]:
    """
    Send extracted PDF text to MiMo-v2-Flash and parse the returned flashcards.

    Args:
        text:       Raw text extracted from the PDF.
        mode:       GenerationMode.questions | GenerationMode.notes
        card_count: How many flashcards to request from the model.

    Returns:
        List of dicts with keys: type, front, back.

    Raises:
        ValueError: If the LLM response cannot be parsed as valid JSON.
        RuntimeError: If the LLM call fails after retries.
    """
    # 1. Truncate text to stay within token limits
    safe_text = truncate_text(text, max_chars=12_000)

    # 2. Pick the right system prompt based on mode
    system_content = (
        SYSTEM_PROMPT_QUESTIONS
        if mode == GenerationMode.questions
        else SYSTEM_PROMPT_NOTES
    )

    # 3. Build messages
    messages = [
        SystemMessage(content=system_content),
        HumanMessage(content=USER_PROMPT_TEMPLATE.format(
            card_count=card_count,
            text=safe_text,
        )),
    ]

    # 4. Call the LLM
    try:
        response = await llm.ainvoke(messages)
        raw_output = response.content
    except Exception as exc:
        raise RuntimeError(
            f"MiMo-v2-Flash (OpenRouter) call failed: {exc}"
        ) from exc

    # 5. Parse and validate JSON
    cards = _parse_flashcard_json(raw_output)

    # 6. Enforce requested count (trim if model returned more)
    return cards[:card_count]


# ---------------------------------------------------------------------------
# JSON parsing helpers
# ---------------------------------------------------------------------------
def _parse_flashcard_json(raw: str) -> list[dict]:
    """
    Robustly extract a JSON array from the LLM's raw response string.

    Handles common LLM quirks:
      - Leading/trailing whitespace
      - Markdown code fences (```json ... ```)
      - Extra text before or after the array
    """
    # Strip whitespace
    text = raw.strip()

    # Remove markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # Try direct parse first
    try:
        data = json.loads(text)
        return _validate_cards(data)
    except json.JSONDecodeError:
        pass

    # Fallback: extract the first [...] block from the response
    match = re.search(r"\[.*?\]", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            return _validate_cards(data)
        except json.JSONDecodeError:
            pass

    raise ValueError(
        f"Could not parse flashcard JSON from LLM response.\n"
        f"Raw output (first 500 chars):\n{raw[:500]}"
    )


def _validate_cards(data: object) -> list[dict]:
    """
    Ensure the parsed JSON is a list of valid flashcard dicts.
    Filters out malformed entries instead of raising hard errors.
    """
    if not isinstance(data, list):
        raise ValueError("Expected a JSON array of flashcards.")

    valid: list[dict] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        if not item.get("front") or not item.get("back"):
            continue

        # Normalise the type field — default to 'question' if missing/unknown
        card_type = str(item.get("type", "question")).lower()
        if card_type not in ("question", "note"):
            card_type = "question"

        valid.append({
            "type":  card_type,
            "front": str(item["front"]).strip(),
            "back":  str(item["back"]).strip(),
        })

    if not valid:
        raise ValueError("LLM returned no valid flashcard objects.")

    return valid