"""The full simplify flow: scrub -> AI -> validate -> safety check -> readability."""

import json
import re

from pydantic import ValidationError

from . import readability
from .pii import scrub
from .prompt import build_system_prompt, build_user_message
from .providers import BaseProvider
from .safety import check_plan
from .schemas import CarePlan


class PlanParseError(Exception):
    pass


def parse_plan(raw: str) -> CarePlan:
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise PlanParseError("no JSON object found")
    try:
        return CarePlan.model_validate(json.loads(text[start : end + 1]))
    except (json.JSONDecodeError, ValidationError) as e:
        raise PlanParseError(str(e)[:500]) from e


async def simplify(text: str, language: str, reading_level: str, provider: BaseProvider) -> dict:
    scrubbed, removed = scrub(text)
    system = build_system_prompt(language, reading_level)
    user = build_user_message(scrubbed)

    raw = await provider.complete_json(system, user)
    try:
        plan = parse_plan(raw)
    except PlanParseError as e:
        # One retry, telling the model what went wrong.
        retry = f"{user}\n\nYour last reply could not be used ({e}). Reply again with ONLY the JSON object in the required shape."
        plan = parse_plan(await provider.complete_json(system, retry))

    return {
        "plan": plan.model_dump(),
        "original_text": scrubbed,
        "removed_details": removed,
        "safety": check_plan(scrubbed, plan, language),
        "readability": readability.compare(scrubbed, plan, language),
        "language": language,
        "provider": provider.name,
        "model": provider.model,
    }
