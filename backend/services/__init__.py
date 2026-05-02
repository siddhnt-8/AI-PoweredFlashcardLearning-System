"""
services/__init__.py — Marks the services directory as a Python package.

Available services:
  - pdf_extractor : Extract text from PDF files using PyMuPDF
  - ai_processor  : Generate flashcards via MiMo-v2-Flash (OpenRouter)
  - scheduler     : SM-2 spaced repetition algorithm
  - auth_service  : JWT creation/decoding + bcrypt password hashing
"""

from services import ai_processor, auth_service, pdf_extractor, scheduler

__all__ = ["pdf_extractor", "ai_processor", "scheduler", "auth_service"]