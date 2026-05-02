"""
services/pdf_extractor.py — Extract clean text from PDF files using PyMuPDF.

Public API:
  extract_text_from_pdf(file_path: str) -> str
      Reads every page of the PDF and returns a single cleaned string.
"""

import re

import fitz  # PyMuPDF


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
# Pages beyond this limit are ignored to avoid sending huge prompts to the LLM
MAX_PAGES = 50

# Minimum characters required to consider a page non-empty
MIN_PAGE_CHARS = 20


# ---------------------------------------------------------------------------
# Main extractor
# ---------------------------------------------------------------------------
def extract_text_from_pdf(file_path: str) -> str:
    """
    Open a PDF file and extract all readable text from it.

    Steps:
      1. Open the document with PyMuPDF (fitz)
      2. Iterate over pages (up to MAX_PAGES)
      3. Extract text from each page using the 'text' mode
      4. Skip pages with no meaningful content
      5. Join pages with a separator and clean up the result

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        A single cleaned string with all extracted text.

    Raises:
        ValueError: If the file cannot be opened or is password-protected.
        RuntimeError: If no text could be extracted from any page.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        raise ValueError(f"Could not open PDF '{file_path}': {exc}") from exc

    # Check for password protection
    if doc.is_encrypted:
        doc.close()
        raise ValueError(
            "The uploaded PDF is password-protected. "
            "Please upload an unlocked version."
        )

    total_pages = min(len(doc), MAX_PAGES)
    page_texts: list[str] = []

    for page_num in range(total_pages):
        page = doc[page_num]

        # Extract text — 'text' mode preserves reading order
        raw = page.get_text("text")

        cleaned = _clean_page_text(raw)

        if len(cleaned) >= MIN_PAGE_CHARS:
            page_texts.append(cleaned)

    doc.close()

    if not page_texts:
        raise RuntimeError(
            "No readable text found in the PDF. "
            "The document may contain only scanned images."
        )

    # Join pages with a clear separator so the LLM knows page boundaries
    full_text = "\n\n--- Page Break ---\n\n".join(page_texts)

    return _clean_document_text(full_text)


# ---------------------------------------------------------------------------
# Cleaning helpers
# ---------------------------------------------------------------------------
def _clean_page_text(text: str) -> str:
    """
    Clean raw text extracted from a single PDF page.

    - Strip leading/trailing whitespace per line
    - Remove lines that are just numbers (page numbers)
    - Collapse multiple blank lines into one
    """
    lines = text.splitlines()

    cleaned_lines: list[str] = []
    for line in lines:
        stripped = line.strip()

        # Skip empty lines and lone page numbers
        if not stripped:
            continue
        if re.fullmatch(r"\d{1,4}", stripped):
            continue

        cleaned_lines.append(stripped)

    return "\n".join(cleaned_lines)


def _clean_document_text(text: str) -> str:
    """
    Final cleanup pass on the full document text.

    - Collapse 3+ consecutive newlines into 2
    - Remove null bytes and other non-printable characters
    - Strip leading/trailing whitespace
    """
    # Remove null bytes
    text = text.replace("\x00", "")

    # Remove non-printable characters except newlines and tabs
    text = re.sub(r"[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]", " ", text)

    # Collapse excessive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


# ---------------------------------------------------------------------------
# Utility: truncate text to stay within LLM token limits
# ---------------------------------------------------------------------------
def truncate_text(text: str, max_chars: int = 12_000) -> str:
    """
    Truncate the extracted text to max_chars characters.

    Splits at the nearest sentence boundary to avoid cutting mid-sentence.
    Used by ai_processor.py before sending text to the LLM.

    Args:
        text:      Full extracted document text.
        max_chars: Maximum number of characters to keep (default ~3k tokens).

    Returns:
        Truncated text string.
    """
    if len(text) <= max_chars:
        return text

    # Cut at max_chars then walk back to the nearest sentence end
    truncated = text[:max_chars]
    last_period = max(
        truncated.rfind("."),
        truncated.rfind("!"),
        truncated.rfind("?"),
    )

    if last_period > max_chars * 0.7:   # only use if reasonably far in
        truncated = truncated[: last_period + 1]

    return truncated + "\n\n[... text truncated for length ...]"