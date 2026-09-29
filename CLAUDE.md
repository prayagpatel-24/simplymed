# SimplyMed: notes for Claude Code

Student research prototype (deadline Nov 15, 2026) that rewrites clinician-written
medical instructions into plain language for patients with low health literacy,
especially adults 65+. It will be reviewed by physician testers. See README.md for setup.

Stack: React + Vite frontend (`frontend/`), FastAPI backend (`backend/`), free AI
providers (Gemini/Groq) behind `backend/app/providers.py`. `AI_PROVIDER=mock` runs with no key.

## Safety rules: do not weaken these

- The tool only rewords and reorganizes. It never diagnoses, recommends treatment,
  changes doses, or invents missed-dose advice, schedules, or purposes.
- Every number, unit, frequency, "as needed" instruction, warning and emergency sign
  must be kept. `backend/app/safety.py` enforces this; if you change the prompt or
  schema, keep the check working and run `pytest` and `python -m eval.run_eval`.
- The original text must always be viewable next to the simplified version.
- Never log, store, or send user text anywhere except the configured AI provider.
  The server keeps nothing. The only exception: My Medicines / Calendar data the user chooses
  to save lives in that browser tab's sessionStorage (`frontend/src/store.jsx`) and is gone when
  the tab closes. No analytics or third-party trackers.
- Reminder times are suggestions the user confirms; the app never decides a schedule.
- Only synthetic example data in the repo.

## Accessibility requirements

Large base text (18px) with a text-size control, contrast of at least 4.5:1 (gold is
for accents only, never body text), semantic HTML with labeled controls, text-labeled
buttons rather than icon-only ones, a simple linear layout, and urgent warnings at the top.
