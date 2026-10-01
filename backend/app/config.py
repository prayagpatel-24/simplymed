"""Settings loaded from backend/.env (never commit that file)."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

# Which AI to use: "gemini", "groq", or "mock" (no key needed, for building the UI).
AI_PROVIDER = os.getenv("AI_PROVIDER", "mock").strip().lower()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

# Comma-separated list of websites allowed to call the API (the frontend dev server by default).
# A trailing "/" would never match the browser's Origin header, so it is removed.
ALLOWED_ORIGINS = [
    o.strip().rstrip("/")
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "8000"))

# Protects the free AI quota when testers share the link.
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))

FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"
