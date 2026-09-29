from app.mock import DEMO_PLAN
from app.pii import scrub
from app.safety import check_plan
from app.schemas import CarePlan

PNEUMONIA = """DISCHARGE INSTRUCTIONS
Patient: [NAME REMOVED]   DOB: [REMOVED]   MRN: [REMOVED]
Dx: Community-acquired pneumonia.
1. Amoxicillin-clavulanate 875 mg PO BID x 10 days. Take with food. Complete full course even if symptoms improve.
2. Acetaminophen 500 mg 1-2 tabs PO q6h PRN fever or pain. Do not exceed 3,000 mg in 24 hrs.
3. Albuterol HFA 90 mcg 2 puffs inhaled q4-6h PRN SOB/wheezing.
Increase PO fluid intake. Rest. Avoid EtOH while on abx.
F/u with PCP in 5-7 days. Repeat CXR in 6 wks.
Return to ED or call 911 for SOB at rest, CP, confusion, lips turning blue, or fever >102.5°F that does not respond to meds."""


def plan(**overrides) -> CarePlan:
    data = {"summary": "Instructions.", **overrides}
    return CarePlan.model_validate(data)


def med(**kw) -> dict:
    return {"name": "Metformin", "original_text": "", **kw}


def messages(report) -> str:
    return " | ".join(i["message"] for i in report["issues"])


def test_demo_plan_passes():
    report = check_plan(PNEUMONIA, CarePlan.model_validate(DEMO_PLAN))
    assert report["passed"], messages(report)
    assert report["issues"] == []


def test_abbreviations_expanded_correctly_pass():
    original = "Metformin 500 mg 1 tab PO BID with meals."
    p = plan(medications=[med(strength="500 mg", dose="1 tablet", frequency="2 times a day",
                              special_instructions=["Take it with a meal."])])
    assert check_plan(original, p)["passed"]


def test_missing_dose_is_flagged():
    original = "Metformin 500 mg PO BID."
    p = plan(medications=[med(frequency="2 times a day")])
    report = check_plan(original, p)
    assert not report["passed"]
    assert "500 mg" in messages(report)


def test_changed_unit_is_flagged():
    original = "Give 5 mL by mouth every 12 hours."
    p = plan(steps=[{"text": "Give 5 mg by mouth every 12 hours."}])
    assert "5 mL" in messages(check_plan(original, p))


def test_frequency_rewritten_as_different_schedule_is_flagged():
    original = "Ibuprofen 400 mg q6h."
    p = plan(medications=[med(name="Ibuprofen", strength="400 mg", frequency="4 times a day")])
    report = check_plan(original, p)
    assert "every 6 hours" in messages(report)


def test_missing_as_needed_is_flagged():
    original = "Oxycodone 5 mg q6h PRN severe pain."
    p = plan(medications=[med(name="Oxycodone", strength="5 mg", frequency="every 6 hours")])
    assert '"as needed"' in messages(check_plan(original, p))


def test_invented_number_is_flagged_as_medium():
    original = "Take aspirin 81 mg daily."
    p = plan(medications=[med(name="Aspirin", strength="81 mg", frequency="1 time a day at 8 PM")])
    report = check_plan(original, p)
    assert report["passed"]
    assert any(i["kind"] == "added" and "8" in i["message"] for i in report["issues"])


def test_invented_medicine_is_flagged():
    original = "Take aspirin 81 mg daily."
    p = plan(medications=[med(name="Aspirin", strength="81 mg", frequency="every day"),
                          med(name="Ibuprofen")])
    assert "Ibuprofen" in messages(check_plan(original, p))


def test_copied_original_text_does_not_count():
    original = "Do not drink alcohol. Take 10 mg daily."
    p = plan(steps=[{"text": "Take your medicine every day.", "original_text": original}])
    msgs = messages(check_plan(original, p))
    assert "10 mg" in msgs and "alcohol" in msgs


def test_scrub_removes_personal_details():
    text = "Patient: John Q. Sample, DOB 01/02/1950, phone (555) 123-4567. MRN: 00482913. Take aspirin 81 mg daily."
    cleaned, removed = scrub(text)
    for secret in ("John", "1950", "555", "00482913"):
        assert secret not in cleaned
    assert "81 mg" in cleaned
    assert set(removed) >= {"name", "date of birth", "phone number", "record number"}
