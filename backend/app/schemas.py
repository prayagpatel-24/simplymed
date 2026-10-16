"""The structured "My Care Plan" the AI must return.

Keeping the output structured (instead of free text) is what lets the site
put warnings at the top, build reminders, and run the safety check.
"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class Medication(BaseModel):
    name: str
    strength: str | None = None
    dose: str | None = None
    route: str | None = None
    frequency: str | None = None
    times_per_day: int | None = None
    interval_hours: int | None = None
    as_needed: bool = False
    # Weekly and some-days medicines (methotrexate on Tuesdays, Bactrim on Mon/Wed/Fri)
    # must never become daily reminders.
    every_day: bool = True
    days_of_week: list[str] = Field(default_factory=list)
    duration: str | None = None
    duration_days: int | None = None
    purpose: str | None = None
    special_instructions: list[str] = Field(default_factory=list)
    missed_dose: str | None = None
    original_text: str = ""

    @field_validator("days_of_week", mode="before")
    @classmethod
    def _clean_days(cls, v):
        # Keep only real day names, written the same way ("tue", "TUESDAY" -> "Tuesday").
        if not isinstance(v, list):
            return []
        days = []
        for item in v:
            word = str(item).strip().lower()[:3]
            day = next((d for d in WEEKDAYS if d.lower().startswith(word)), None) if len(word) == 3 else None
            if day and day not in days:
                days.append(day)
        return sorted(days, key=WEEKDAYS.index)

    @field_validator("every_day", mode="before")
    @classmethod
    def _null_every_day(cls, v):
        return True if v is None else v

    @model_validator(mode="after")
    def _named_days_are_not_every_day(self):
        if self.days_of_week and len(self.days_of_week) < 7:
            self.every_day = False
        return self


class Step(BaseModel):
    text: str
    original_text: str = ""


WarningAction = Literal["call_911", "go_to_er", "call_doctor", "other"]


class WarningSign(BaseModel):
    sign: str
    action: WarningAction = "other"
    action_text: str = ""
    original_text: str = ""

    @field_validator("action", mode="before")
    @classmethod
    def _unknown_action_is_other(cls, v):
        return v if v in ("call_911", "go_to_er", "call_doctor") else "other"


class FollowUp(BaseModel):
    what: str
    when: str | None = None
    original_text: str = ""


class CarePlan(BaseModel):
    summary: list[str] = Field(default_factory=list)
    medications: list[Medication] = Field(default_factory=list)
    steps: list[Step] = Field(default_factory=list)
    warning_signs: list[WarningSign] = Field(default_factory=list)
    follow_ups: list[FollowUp] = Field(default_factory=list)
    checklist: list[str] = Field(default_factory=list)
    questions_to_ask: list[str] = Field(default_factory=list)
    unclear_items: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def _nulls_to_empty_lists(cls, data):
        # Models sometimes send null instead of [] for empty sections.
        if isinstance(data, dict):
            # The summary is bullet points; older answers sent one string.
            if isinstance(data.get("summary"), str):
                data["summary"] = [data["summary"]]
            for key in ("summary", "medications", "steps", "warning_signs", "follow_ups",
                        "checklist", "questions_to_ask", "unclear_items"):
                if data.get(key) is None:
                    data[key] = []
        return data
