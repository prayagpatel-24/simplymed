"""Before/after reading-level scores (Flesch-Kincaid Grade Level and Flesch Reading Ease).

The formulas are implemented here directly so they are easy to cite and explain:
  grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  ease  = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)

Limits: they only count sentence and word length. They can't tell whether someone
actually understood the text, so report them next to real user testing.
"""

import re

from .schemas import CarePlan

WORD_RE = re.compile(r"[A-Za-z]+(?:'[a-z]+)?")


def count_syllables(word: str) -> int:
    w = word.lower()
    if len(w) <= 3:
        return 1
    w = re.sub(r"(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$", lambda m: m.group(0)[0], w)
    return max(1, len(re.findall(r"[aeiouy]+", w)))


def _sentence(s: str | None) -> str:
    s = (s or "").strip()
    return s if not s or s[-1] in ".!?:" else s + "."


def readable_text(plan: CarePlan) -> str:
    parts = [*plan.summary]
    for m in plan.medications:
        line = " ".join(p for p in [m.name, m.strength, m.dose, m.route, m.frequency, m.duration] if p)
        parts += [line, m.purpose, *m.special_instructions, m.missed_dose]
    parts += [s.text for s in plan.steps]
    parts += [f"{w.sign}: {w.action_text}" for w in plan.warning_signs]
    parts += [" ".join(p for p in [f.what, f.when] if p) for f in plan.follow_ups]
    parts += plan.checklist
    return " ".join(_sentence(p) for p in parts if p)


def _clean_original(text: str) -> str:
    # End each line with a period so headings and list items count as sentences.
    return " ".join(_sentence(l) for l in text.splitlines() if l.strip())


def score(text: str) -> dict:
    words = WORD_RE.findall(text)
    sentences = max(1, len(re.findall(r"[.!?:]+(?:\s|$)", text)))
    if not words:
        return {"grade": 0.0, "reading_ease": 100.0, "words": 0}
    wps = len(words) / sentences
    spw = sum(count_syllables(w) for w in words) / len(words)
    return {
        "grade": round(max(0.0, 0.39 * wps + 11.8 * spw - 15.59), 1),
        "reading_ease": round(206.835 - 1.015 * wps - 84.6 * spw, 1),
        "words": len(words),
    }


def compare(original: str, plan: CarePlan, language: str = "en") -> dict | None:
    if language != "en":
        return None  # These formulas are designed for English.
    return {"original": score(_clean_original(original)), "simplified": score(readable_text(plan))}
