"""
routers/__init__.py — Marks the routers directory as a Python package.

Available routers:
  - auth       : POST /auth/signup | POST /auth/login | GET /auth/me
  - upload     : POST /upload/pdf
  - flashcards : GET|DELETE /flashcards/
  - review     : POST /review/ | GET /review/due
"""

from routers import auth, flashcards, review, upload

__all__ = ["auth", "upload", "flashcards", "review"]