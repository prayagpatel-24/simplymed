"""Demo answers used when AI_PROVIDER=mock, so the site works without an API key."""

import json
import re

# A hand-written plan for the pneumonia example in frontend/src/samples.js.
DEMO_PLAN = {
    "summary": "You were treated for pneumonia, a lung infection. These steps help you get better at home.",
    "medications": [
        {
            "name": "Amoxicillin-clavulanate",
            "strength": "875 mg (milligrams)",
            "dose": "1 tablet",
            "route": "by mouth",
            "frequency": "2 times a day",
            "times_per_day": 2,
            "interval_hours": None,
            "as_needed": False,
            "duration": "for 10 days",
            "duration_days": 10,
            "purpose": None,
            "special_instructions": [
                "Take it with food.",
                "Finish all of it, even if you feel better.",
            ],
            "missed_dose": None,
            "original_text": "Amoxicillin-clavulanate 875 mg PO BID x 10 days. Take with food. Complete full course even if symptoms improve.",
        },
        {
            "name": "Acetaminophen",
            "strength": "500 mg (milligrams) per tablet",
            "dose": "1 to 2 tablets",
            "route": "by mouth",
            "frequency": "every 6 hours, only as needed for fever or pain",
            "times_per_day": None,
            "interval_hours": 6,
            "as_needed": True,
            "duration": None,
            "duration_days": None,
            "purpose": "For fever or pain.",
            "special_instructions": ["Do not take more than 3000 mg in 24 hours."],
            "missed_dose": None,
            "original_text": "Acetaminophen 500 mg 1-2 tabs PO q6h PRN fever or pain. Do not exceed 3,000 mg in 24 hrs.",
        },
        {
            "name": "Albuterol HFA",
            "strength": "90 mcg (micrograms) per puff",
            "dose": "2 puffs",
            "route": "breathe in from the inhaler",
            "frequency": "every 4 to 6 hours, only as needed for shortness of breath or wheezing",
            "times_per_day": None,
            "interval_hours": None,
            "as_needed": True,
            "duration": None,
            "duration_days": None,
            "purpose": "For shortness of breath or wheezing.",
            "special_instructions": [],
            "missed_dose": None,
            "original_text": "Albuterol HFA 90 mcg 2 puffs inhaled q4-6h PRN SOB/wheezing.",
        },
    ],
    "steps": [
        {"text": "Drink more fluids.", "original_text": "Increase PO fluid intake."},
        {"text": "Get plenty of rest.", "original_text": "Rest."},
        {"text": "Do not drink alcohol while you take the antibiotic.", "original_text": "Avoid EtOH while on abx."},
    ],
    "warning_signs": [
        {"sign": "Shortness of breath while resting", "action": "call_911", "action_text": "Go to the emergency room or call 911.", "original_text": "SOB at rest"},
        {"sign": "Chest pain", "action": "call_911", "action_text": "Go to the emergency room or call 911.", "original_text": "CP"},
        {"sign": "Confusion", "action": "call_911", "action_text": "Go to the emergency room or call 911.", "original_text": "confusion"},
        {"sign": "Lips turning blue", "action": "call_911", "action_text": "Go to the emergency room or call 911.", "original_text": "lips turning blue"},
        {"sign": "Fever over 102.5°F that does not go down with medicine", "action": "call_911", "action_text": "Go to the emergency room or call 911.", "original_text": "fever >102.5°F that does not respond to meds"},
    ],
    "follow_ups": [
        {"what": "Visit your regular doctor", "when": "in 5 to 7 days", "original_text": "F/u with PCP in 5-7 days."},
        {"what": "Get another chest X-ray", "when": "in 6 weeks", "original_text": "Repeat CXR in 6 wks."},
    ],
    "checklist": [
        "Take amoxicillin-clavulanate with food, 2 times a day.",
        "Drink extra fluids today.",
        "Make an appointment with your regular doctor.",
        "Schedule your chest X-ray.",
    ],
    "questions_to_ask": [
        "What should I do if I miss a dose of my antibiotic?",
        "Where should I go for my chest X-ray?",
        "How will I know my pneumonia is getting better?",
    ],
    "unclear_items": [],
}


def build_mock_response(user_message: str) -> str:
    match = re.search(r"<original>\n?(.*?)\n?</original>", user_message, re.S)
    original = match.group(1) if match else user_message

    if "amoxicillin-clavulanate" in original.lower():
        return json.dumps(DEMO_PLAN)

    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", original) if s.strip()]
    return json.dumps({
        "summary": "Demo mode: no AI is connected, so this just splits the original into steps. "
                   "Add an API key in backend/.env to get a real plain-language version.",
        "steps": [{"text": s, "original_text": s} for s in sentences[:20]],
        "questions_to_ask": ["What is the most important thing for me to do?"],
    })
