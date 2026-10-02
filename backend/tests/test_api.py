from fastapi.testclient import TestClient

from app import config, main
from app.chat import build_messages
from app.pii import age_label
from app.prompt import build_system_prompt
from app.schemas import CarePlan

client = TestClient(main.app)


def use_mock(monkeypatch):
    monkeypatch.setattr(config, "AI_PROVIDER", "mock")
    main._recent.clear()


def test_summary_string_becomes_one_bullet():
    assert CarePlan.model_validate({"summary": "One idea."}).summary == ["One idea."]
    assert CarePlan.model_validate({"summary": None}).summary == []


def test_age_over_89_is_grouped():
    assert age_label(None) is None
    assert age_label(8) == "8"
    assert age_label(89) == "89"
    assert age_label(90) == age_label(104) == "90 or older"


def test_age_rules_only_when_age_given():
    assert "PATIENT AGE" not in build_system_prompt("en")
    prompt = build_system_prompt("en", "75")
    assert "PATIENT AGE: 75" in prompt
    assert "Never state age-specific doses" in prompt


def test_simplify_returns_age_label(monkeypatch):
    use_mock(monkeypatch)
    r = client.post("/api/simplify", json={"text": "Take aspirin 81 mg daily.", "age": 95})
    assert r.status_code == 200
    assert r.json()["age"] == "90 or older"
    assert isinstance(r.json()["plan"]["summary"], list)


def test_simplify_rejects_impossible_age(monkeypatch):
    use_mock(monkeypatch)
    assert client.post("/api/simplify", json={"text": "Take aspirin 81 mg daily.", "age": 300}).status_code == 422


def test_chat_messages_are_scrubbed_and_start_with_user():
    msgs = build_messages(
        [
            {"role": "assistant", "content": "Hi! How can I help?"},
            {"role": "user", "content": "My number is (555) 123-4567. What does PRN mean?"},
        ],
        plan={"summary": ["You had pneumonia."]},
    )
    assert msgs[0]["role"] == "user"
    assert "555" not in msgs[0]["content"]
    assert "<care_plan>" in msgs[0]["content"]


def test_chat_endpoint_mock(monkeypatch):
    use_mock(monkeypatch)
    r = client.post("/api/chat", json={"messages": [{"role": "user", "content": "How do I save?"}]})
    assert r.status_code == 200
    assert r.json()["reply"].startswith("- ")
