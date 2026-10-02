"""Rule-based safety check. No AI involved.

It compares the original instructions with the AI's version and flags:
  * numbers, doses and units that disappeared or changed   (high)
  * frequencies (BID, q6h, ...) that disappeared            (high)
  * "as needed", emergency, alcohol, driving ... warnings
    that disappeared                                        (high)
  * medicine names that are not in the original              (high)
  * numbers or dates that look invented or reformatted       (medium)

It can't prove the meaning is the same. It catches the most dangerous kind of
mistake: a critical detail being dropped or changed.
"""

import re

from .schemas import CarePlan

WORD_NUMBERS = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6",
    "seven": "7", "eight": "8", "nine": "9", "ten": "10", "eleven": "11", "twelve": "12",
}

# (regex for the unit, canonical name). Order matters: longer units first.
UNITS = [
    (r"mcg|µg|micrograms?", "mcg"),
    (r"mg|milligrams?", "mg"),
    (r"ml|milliliters?|millilitres?|cc", "mL"),
    (r"units?", "units"),
    (r"tablets?|tabs?|pills?", "tablet"),
    (r"capsules?|caps?", "capsule"),
    (r"puffs?|inhalations?|inh", "puff"),
    (r"drops?|gtts?", "drop"),
    (r"teaspoons?|tsp", "tsp"),
    (r"tablespoons?|tbsp", "tbsp"),
    (r"lbs?|pounds?", "lb"),
    (r"liters?|litres?|l", "L"),
    (r"grams?|g", "g"),
]
UNIT_CANON = [(re.compile(rf"^(?:{pat})$"), name) for pat, name in UNITS]
QUANTITY_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(" + "|".join(pat for pat, _ in UNITS) + r")\b"
)

# (pattern, canonical label, implied numbers). Matched spans are blanked out so
# "twice daily" is not also counted as "daily".
FREQUENCIES = [
    (r"\bq\.?\s?(\d+(?:-\d+)?)\s?h(?:rs?|ours?)?\b", "every {0} hours", ()),
    (r"\bevery (\d+(?:-\d+)?) ?(?:hours?|hrs?|h)\b", "every {0} hours", ()),
    (r"\b(?:bid|b\.i\.d\.?|twice (?:a|per|each) day|twice daily|2 times (?:a|per|each) day|2 times daily)", "2 times a day", ("2",)),
    (r"\b(?:tid|t\.i\.d\.?|3 times (?:a|per|each) day|3 times daily)", "3 times a day", ("3",)),
    (r"\b(?:qid|q\.i\.d\.?|4 times (?:a|per|each) day|4 times daily)", "4 times a day", ("4",)),
    (r"\b(?:qhs|at bedtime|before bed(?:time)?)\b", "at bedtime", ("1",)),
    (r"\b(?:qam|q\.a\.m\.|every morning|each morning|in the morning)\b", "in the morning", ("1",)),
    (r"\b(?:qd|q\.d\.|daily|once (?:a|per|each) day|once daily|1 time (?:a|per|each) day|every day|each day)\b", "1 time a day", ("1",)),
]
FREQUENCIES = [(re.compile(p), label, implied) for p, label, implied in FREQUENCIES]

# (found in the original, must then appear in the simplified text, description)
KEYWORD_RULES = [
    (r"\bprn\b|as needed|if needed|when needed|as required",
     r"as needed|if needed|when needed|only when|only if|if you need", '"as needed" instruction'),
    (r"\b(?:ed|er)\b|emergency", r"emergency|\ber\b|911", "go to the emergency room"),
    (r"alcohol|\betoh\b", r"alcohol|beer|wine|liquor", "alcohol warning"),
    (r"\bdriv(?:e|ing)\b|machinery", r"\bdriv", "driving warning"),
    (r"grapefruit", r"grapefruit", "grapefruit warning"),
    (r"pregnan", r"pregnan", "pregnancy warning"),
    (r"allerg", r"allerg", "allergy warning"),
    (r"do not exceed|not to exceed|no more than|\bmax(?:imum)?\b",
     r"no more than|do not take more|not more than|maximum|do not exceed|more than", "maximum dose limit"),
    (r"with (?:food|meals?)|w/ ?(?:food|meals?)|after (?:eating|meals?)", r"food|meal|\beat", "take with food"),
    (r"empty stomach", r"empty stomach|before (?:you )?(?:eat|breakfast|food|meals?)", "empty stomach"),
    (r"do not (?:crush|chew|break)", r"crush|chew|break", "do not crush or chew"),
    (r"\bshake\b", r"\bshake", "shake well"),
    (r"refrigerat", r"refrigerat|fridge", "keep in the refrigerator"),
    (r"(?:complete|finish) (?:the )?(?:full |entire |whole )?(?:course|all)|until (?:all )?(?:gone|finished)",
     r"finish|all of (?:it|the)|every dose|complete|until .* gone", "finish all the medicine"),
    (r"\brefills?\b", r"refill", "refill information"),
    (r"\bno (?:lifting|baths?|swimming)|\bavoid\b|do not\b", r"\bno\b|do not|don't|avoid|stay away|never", '"do not" / "avoid" instruction'),
]
KEYWORD_RULES = [(re.compile(o), re.compile(s), label) for o, s, label in KEYWORD_RULES]

DATE_RE = re.compile(r"\b\d{1,2}/\d{1,2}(?:/\d{2,4})?\b")
LIST_MARKER_RE = re.compile(r"(?m)^\s*\d+[.)]\s+")
NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")


def normalize(text: str) -> str:
    t = LIST_MARKER_RE.sub(" ", text).lower()
    t = t.replace("½", " 0.5").replace("–", "-").replace("—", "-")
    t = re.sub(r"(\d),(\d{3})\b", r"\1\2", t)          # 3,000 -> 3000
    t = re.sub(r"\b(\d{1,2}):00\b", r"\1", t)           # 8:00 -> 8
    for word, digit in WORD_NUMBERS.items():
        t = re.sub(rf"\b{word}\b", digit, t)
    t = re.sub(r"(\d+(?:\.\d+)?)\s*(?:to|-|or)\s*(\d+(?:\.\d+)?)", r"\1-\2", t)  # 4 to 6 -> 4-6
    return re.sub(r"\s+", " ", t)


def _canon_number(n: str) -> str:
    return str(float(n)).removesuffix(".0")


def _canon_unit(u: str) -> str:
    for pat, name in UNIT_CANON:
        if pat.match(u):
            return name
    return u


def extract_numbers(t: str) -> set[str]:
    return {_canon_number(n) for n in NUMBER_RE.findall(DATE_RE.sub(" ", t))}


def extract_quantities(t: str) -> set[tuple[str, str]]:
    return {(_canon_number(n), _canon_unit(u)) for n, u in QUANTITY_RE.findall(DATE_RE.sub(" ", t))}


def extract_frequencies(t: str) -> tuple[set[str], set[str]]:
    """Return (canonical frequencies, numbers they imply)."""
    found, implied = set(), set()
    for pattern, label, nums in FREQUENCIES:
        for m in pattern.finditer(t):
            found.add(label.format(*m.groups()))
            implied.update(nums)
            implied.update(extract_numbers(" ".join(m.groups())))
        t = pattern.sub(" ", t)
    return found, implied


def plan_text(plan: CarePlan) -> str:
    """Everything the patient reads as instructions. original_text is left out on
    purpose (copying the original must not count as keeping a detail), and so are
    questions_to_ask / unclear_items (a number only in a question isn't kept)."""
    parts = [*plan.summary]
    for m in plan.medications:
        parts += [m.name, m.strength, m.dose, m.route, m.frequency, m.duration,
                  m.purpose, m.missed_dose, *m.special_instructions]
    parts += [s.text for s in plan.steps]
    for w in plan.warning_signs:
        parts += [w.sign, w.action_text]
    for f in plan.follow_ups:
        parts += [f.what, f.when]
    parts += plan.checklist
    return "\n".join(p for p in parts if p)


def check_plan(original: str, plan: CarePlan, language: str = "en") -> dict:
    orig = normalize(original)
    simp_raw = plan_text(plan)
    simp = normalize(simp_raw)
    issues: list[dict] = []

    def add(severity: str, kind: str, message: str) -> None:
        issues.append({"severity": severity, "kind": kind, "message": message})

    # 1. Doses with units (e.g. 875 mg, 2 puffs). Units may be translated in
    #    other languages, so this runs for English only.
    covered: set[str] = set()
    if language == "en":
        simp_q = extract_quantities(simp)
        for num, unit in sorted(extract_quantities(orig)):
            covered.add(num)
            if (num, unit) not in simp_q:
                add("high", "dose", f'"{num} {unit}" is in the original but not in the simpler version.')

    # 2. Every other number (durations, days, temperatures, 911 ...).
    orig_nums, simp_nums = extract_numbers(orig), extract_numbers(simp)
    for n in sorted(orig_nums - simp_nums - covered, key=float):
        add("high", "number", f'The number {n} is in the original but not in the simpler version.')

    # 3. Frequencies.
    orig_freq, implied = extract_frequencies(orig)
    if language == "en":
        simp_freq, _ = extract_frequencies(simp)
        for f in sorted(orig_freq - simp_freq):
            add("high", "timing", f'The timing "{f}" from the original is missing or was changed.')

    # 4. Numbers that appear only in the simpler version (possibly invented).
    for n in sorted(simp_nums - orig_nums - implied - {"24"}, key=float):
        add("medium", "added", f"The simpler version mentions {n}, which is not in the original. Make sure it was not made up.")

    # 5. Dates (they may have been reformatted, so this is only a warning).
    for d in sorted(set(DATE_RE.findall(orig))):
        if d not in simp_raw:
            add("medium", "date", f"The date {d} was not found written the same way. Check it carefully.")

    # 6. Warnings and special instructions.
    if language == "en":
        for orig_pat, simp_pat, label in KEYWORD_RULES:
            if orig_pat.search(orig) and not simp_pat.search(simp):
                add("high", "warning", f"Possibly missing from the simpler version: {label} (it is in the original).")

    # 7. Medicines that are not in the original.
    for m in plan.medications:
        words = [w for w in re.findall(r"[a-z]{4,}", m.name.lower())]
        if words and not any(w in orig for w in words):
            add("high", "medicine", f'The medicine "{m.name}" does not appear in the original.')

    checked = ["numbers", "doses", "dates", "medicine names"]
    note = None
    if language == "en":
        checked += ["timing", "warnings"]
    else:
        note = "For languages other than English, only numbers, dates and medicine names are checked automatically."

    return {
        "passed": not any(i["severity"] == "high" for i in issues),
        "issues": issues,
        "checked": checked,
        "note": note,
    }
