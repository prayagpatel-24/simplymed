"""Remove obvious personal details before text is sent to the AI.

This is a safety net, not a guarantee. Testers must still use made-up examples.
A stronger option later is Microsoft Presidio (https://microsoft.github.io/presidio/).
"""

import re

# Order matters: the more specific patterns run first.
PATTERNS: list[tuple[str, re.Pattern, str]] = [
    ("name", re.compile(r"(?im)^(\s*(?:patient(?:\s+name)?|name|pt)\s*:\s*)([^\n]*?)(?=\s{2,}|\s+(?:DOB|MRN|Date of Birth)\b|$)"), r"\1[NAME REMOVED]"),
    ("date of birth", re.compile(r"(?i)\b(DOB|Date of Birth|D\.O\.B\.)\s*[:#]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})"), r"\1: [REMOVED]"),
    ("record number", re.compile(r"(?i)\b(MRN|Medical Record(?: Number| No\.?)?|Acct(?:ount)?(?: No\.?| Number)?|Rx\s?#)\s*[:#]?\s*[A-Z0-9\-]{4,}"), r"\1: [REMOVED]"),
    ("social security number", re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REMOVED]"),
    ("email", re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[EMAIL REMOVED]"),
    ("phone number", re.compile(r"(?<!\d)(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)"), "[PHONE REMOVED]"),
    ("street address", re.compile(r"(?i)\b\d{1,6}\s+(?:[A-Z][a-z]+\s){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Court|Ct|Way)\b\.?"), "[ADDRESS REMOVED]"),
]


def age_label(age: int | None) -> str | None:
    """Ages over 89 count as identifying under HIPAA, so they are grouped."""
    if age is None:
        return None
    return "90 or older" if age >= 90 else str(age)


def scrub(text: str) -> tuple[str, list[str]]:
    """Return (cleaned text, list of the kinds of details that were removed)."""
    removed: list[str] = []
    for label, pattern, replacement in PATTERNS:
        text, count = pattern.subn(replacement, text)
        if count and label not in removed:
            removed.append(label)
    return text, removed
