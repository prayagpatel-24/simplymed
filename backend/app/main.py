"""SimplyMed API.

Run locally:  uvicorn app.main:app --reload   (from the backend folder)

Privacy: user text is never saved or logged. It is only sent to the AI provider.
"""

import logging
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import config
from .chat import answer
from .pipeline import PlanParseError, simplify
from .providers import ProviderError, get_provider

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SimplyMed API", docs_url="/api/docs", openapi_url="/api/openapi.json")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class SimplifyRequest(BaseModel):
    text: str = Field(min_length=10, max_length=config.MAX_INPUT_CHARS)
    language: Literal["en", "es", "zh", "vi"] = "en"
    # An age, never a birth date. Ages 90+ are grouped before they reach the AI.
    age: int | None = Field(default=None, ge=0, le=120)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    plan: dict | None = None


_recent: dict[str, deque] = defaultdict(deque)


def _check_rate_limit(request: Request) -> None:
    # Behind Vercel the visitor's address is in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "unknown")
    now, window = time.monotonic(), _recent[ip]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= config.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(429, "Too many requests. Please wait a minute and try again.")
    window.append(now)


@app.get("/api/health")
def health():
    try:
        provider = get_provider()
        return {"status": "ok", "provider": provider.name, "model": provider.model}
    except ProviderError as e:
        return {"status": "misconfigured", "detail": str(e)}


@app.post("/api/simplify")
async def simplify_endpoint(req: SimplifyRequest, request: Request):
    _check_rate_limit(request)
    try:
        provider = get_provider()
    except ProviderError as e:
        raise HTTPException(503, str(e))
    try:
        return await simplify(req.text, req.language, provider, age=req.age)
    except ProviderError as e:
        raise HTTPException(502, str(e))
    except PlanParseError:
        raise HTTPException(502, "The AI's answer could not be read. Please try again.")


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    _check_rate_limit(request)
    try:
        provider = get_provider()
    except ProviderError as e:
        raise HTTPException(503, str(e))
    try:
        reply = await answer([m.model_dump() for m in req.messages], req.plan, provider)
    except ProviderError as e:
        raise HTTPException(502, str(e))
    return {"reply": reply}


# In production the built website is served from the same server.
if config.FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=config.FRONTEND_DIST, html=True), name="frontend")
