"""
routers/__init__.py — Marks the routers directory as a Python package.

Available routers:
  - upload     : POST /upload/pdf
  - flashcards : GET|DELETE /flashcards/
  - review     : POST /review/ | GET /review/due
"""

from routers import flashcards, review, upload

__all__ = ["upload", "flashcards", "review"]