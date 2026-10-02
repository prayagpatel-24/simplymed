# SimplyMed: notes for Claude Code

Student research prototype (deadline Nov 15, 2026) that rewrites clinician-written
medical instructions into plain language for patients with low health literacy,
especially adults 65+. It will be reviewed by physician testers. See README.md for setup.

Stack: React + Vite frontend (`frontend/`), FastAPI backend (`backend/`), free AI
providers (Gemini/Groq) behind `backend/app/providers.py`. `AI_PROVIDER=mock` runs with no key.
Hosted on Vercel (`vercel.json`, `api/index.py`); accounts and saved data in Supabase
(`supabase/schema.sql`). Without Supabase settings the app runs in guest mode.

## Safety rules: do not weaken these

- The tool only rewords and reorganizes. It never diagnoses, recommends treatment,
  changes doses, or invents missed-dose advice, schedules, or purposes.
- Every number, unit, frequency, "as needed" instruction, warning and emergency sign
  must be kept. `backend/app/safety.py` enforces this; if you change the prompt or
  schema, keep the check working and run `pytest` and `python -m eval.run_eval`.
- The original text must always be viewable next to the simplified version.
- Never log, store, or send the pasted instructions anywhere except the configured AI
  provider. The server keeps nothing. What the user chooses to save (My Medicines, including
  each medicine's original-words excerpt, Calendar, age, text size) goes to Supabase when signed in, protected by Row Level Security, or to the
  tab's sessionStorage as a guest (`frontend/src/store.jsx`). Feedback goes to Supabase.
  No analytics or third-party trackers.
- Age, never a birth date. Ages 90+ are sent as "90 or older". Age may only change wording
  (caregiver voice for under 18) and add questions to ask; the AI must not state age-specific
  doses, side effects or risks that are not in the original.
- The Help chatbot (`backend/app/chat.py`) explains the app and the user's own care plan only.
  It never diagnoses or gives dosing advice, and it points to 911 for emergencies.
- Reminder times are suggestions the user confirms; the app never decides a schedule.
- Only synthetic example data in the repo.

## Accessibility requirements

Large base text (18px) with a text-size control that enlarges text (font sizes in `em`, layout in `rem`), contrast of at least 4.5:1 (gold is
for accents only, never body text), semantic HTML with labeled controls, text-labeled
buttons rather than icon-only ones (icons only beside a label), a simple linear layout, and
urgent warnings at the top. AI answers are short bullet points at a 5th-grade level.
