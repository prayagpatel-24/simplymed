"""The full simplify flow: scrub -> AI -> validate -> safety check (one corrected retry) -> readability."""

import json
import re

from pydantic import ValidationError

from . import readability
from .pii import age_label, scrub
from .prompt import build_system_prompt, build_user_message
from .providers import BaseProvider, ProviderError
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


def _high(safety: dict) -> list[str]:
    return [i["message"] for i in safety["issues"] if i["severity"] == "high"]


async def _try_to_fix(plan, safety, scrubbed, language, system, user, provider):
    """The safety check failed: show the AI what it dropped and ask once more.

    The second answer is used only if it has fewer serious problems. Whatever is
    left is still shown to the user in the safety banner.
    """
    problems = "\n".join(f"- {m}" for m in _high(safety)[:25])
    retry = (
        f"{user}\n\nYour last reply left out or changed details from the original:\n{problems}\n\n"
        "Reply again with the complete JSON object. Include every medicine (each as its own entry), "
        "every instruction, every warning or emergency sign, and every appointment from the original. "
        "Do not summarize, merge, or shorten them, and do not add anything that is not in the original."
    )
    try:
        second = parse_plan(await provider.complete_json(system, retry))
    except (PlanParseError, ProviderError):
        return plan, safety
    second_safety = check_plan(scrubbed, second, language)
    if len(_high(second_safety)) < len(_high(safety)):
        return second, second_safety
    return plan, safety


async def simplify(text: str, language: str, provider: BaseProvider, age: int | None = None) -> dict:
    scrubbed, removed = scrub(text)
    age_text = age_label(age)
    system = build_system_prompt(language, age_text)
    user = build_user_message(scrubbed)

    raw = await provider.complete_json(system, user)
    try:
        plan = parse_plan(raw)
    except PlanParseError as e:
        # One retry, telling the model what went wrong.
        retry = f"{user}\n\nYour last reply could not be used ({e}). Reply again with ONLY the JSON object in the required shape."
        plan = parse_plan(await provider.complete_json(system, retry))

    safety = check_plan(scrubbed, plan, language)
    if not safety["passed"]:
        plan, safety = await _try_to_fix(plan, safety, scrubbed, language, system, user, provider)

    return {
        "plan": plan.model_dump(),
        "original_text": scrubbed,
        "removed_details": removed,
        "safety": safety,
        "readability": readability.compare(scrubbed, plan, language),
        "language": language,
        "age": age_text,
        "provider": provider.name,
        "model": provider.model,
    }
