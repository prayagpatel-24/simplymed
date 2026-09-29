"""AI providers. Switch between them with AI_PROVIDER in backend/.env.

To add a paid provider later (Claude, OpenAI, ...), add a class with the same
`complete_json(system, user) -> str` method and register it in get_provider().
"""

import logging

import httpx

from . import config
from .mock import build_mock_response

log = logging.getLogger("simplymed.providers")


class ProviderError(Exception):
    """A problem talking to the AI. The message is safe to show to users."""


class BaseProvider:
    name = "base"
    model = ""

    async def complete_json(self, system: str, user: str) -> str:
        raise NotImplementedError


class GeminiProvider(BaseProvider):
    name = "gemini"
    URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def complete_json(self, system: str, user: str) -> str:
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
        }
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(
                self.URL.format(model=self.model),
                headers={"x-goog-api-key": self.api_key},
                json=body,
            )
        _raise_for_status(r, "Gemini")
        try:
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, ValueError):
            raise ProviderError("The AI did not return an answer. Please try again.")


class GroqProvider(BaseProvider):
    name = "groq"
    URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def complete_json(self, system: str, user: str) -> str:
        body = {
            "model": self.model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(
                self.URL, headers={"Authorization": f"Bearer {self.api_key}"}, json=body
            )
        _raise_for_status(r, "Groq")
        try:
            return r.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError):
            raise ProviderError("The AI did not return an answer. Please try again.")


class MockProvider(BaseProvider):
    """No AI at all. Lets you build and test the website without a key."""

    name = "mock"
    model = "demo"

    async def complete_json(self, system: str, user: str) -> str:
        return build_mock_response(user)


def _raise_for_status(r: httpx.Response, label: str) -> None:
    if r.status_code == 429:
        raise ProviderError("The free AI limit was reached. Please wait a minute and try again.")
    if r.status_code in (401, 403):
        log.error("%s error %s: %s", label, r.status_code, r.text[:500])
        raise ProviderError(f"The {label} API key was refused ({r.status_code}). Check the key in backend/.env.")
    if r.status_code >= 400:
        # Log the status and the provider's error only; never the patient text.
        log.error("%s error %s: %s", label, r.status_code, r.text[:500])
        raise ProviderError(f"The AI service returned an error ({r.status_code}). Please try again.")


def get_provider() -> BaseProvider:
    if config.AI_PROVIDER == "gemini":
        if not config.GEMINI_API_KEY:
            raise ProviderError("GEMINI_API_KEY is missing from backend/.env.")
        return GeminiProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL)
    if config.AI_PROVIDER == "groq":
        if not config.GROQ_API_KEY:
            raise ProviderError("GROQ_API_KEY is missing from backend/.env.")
        return GroqProvider(config.GROQ_API_KEY, config.GROQ_MODEL)
    return MockProvider()
