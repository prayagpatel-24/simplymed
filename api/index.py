"""Vercel entry point: runs the FastAPI backend (backend/app) as a serverless function.

vercel.json sends every /api/... request here. Locally, use uvicorn from backend/ instead.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402
