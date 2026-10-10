import asyncio
import json

from app.mock import DEMO_PLAN
from app.pipeline import simplify
from app.providers import BaseProvider, ProviderError
from tests.test_safety import PNEUMONIA

# What a model did in testing: kept one medicine and summarized the rest away.
ONLY_ONE_MEDICINE = {
    "summary": ["You have pneumonia.", "Follow up with your doctor in about a week."],
    "medications": [DEMO_PLAN["medications"][0]],
}


class FakeProvider(BaseProvider):
    name, model = "fake", "fake"

    def __init__(self, *replies):
        self.replies = list(replies)
        self.prompts = []

    async def complete_json(self, system, user):
        self.prompts.append(user)
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return json.dumps(reply)


def run(provider):
    return asyncio.run(simplify(PNEUMONIA, "en", provider))


def test_incomplete_answer_is_sent_back_and_fixed():
    provider = FakeProvider(ONLY_ONE_MEDICINE, DEMO_PLAN)
    result = run(provider)
    assert len(provider.prompts) == 2
    assert "500 mg" in provider.prompts[1]  # the AI is told what it dropped
    assert result["safety"]["passed"]
    assert len(result["plan"]["medications"]) == 3


def test_complete_answer_is_not_asked_twice():
    provider = FakeProvider(DEMO_PLAN)
    assert run(provider)["safety"]["passed"]
    assert len(provider.prompts) == 1


def test_second_answer_is_ignored_if_it_is_not_better():
    provider = FakeProvider(ONLY_ONE_MEDICINE, {"summary": ["You have pneumonia."]})
    result = run(provider)
    assert not result["safety"]["passed"]  # the warning banner still shows
    assert len(result["plan"]["medications"]) == 1


def test_first_answer_is_kept_if_the_retry_fails():
    provider = FakeProvider(ONLY_ONE_MEDICINE, ProviderError("busy"))
    result = run(provider)
    assert not result["safety"]["passed"]
    assert len(result["plan"]["medications"]) == 1
