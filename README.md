# SimplyMed

A student research prototype that turns confusing prescription labels and discharge
instructions into a plain-language **My Care Plan**: medicines, what to do, when to get
help, a checklist, calendar reminders, and questions to ask, with the original words
always one click away.

> Not medical advice. Use made-up examples only. Never enter real patient information.

## How it works

```
Browser (React)  ->  FastAPI backend  ->  AI model (Gemini / Groq, free tiers)
                        |
                        |-- 1. removes names, birth dates, phone numbers, record numbers
                        |-- 2. asks the AI for a structured care plan (JSON)
                        |-- 3. rule-based safety check: every number, dose, unit,
                        |      frequency and warning in the original must still be there
                        '-- 4. before/after reading-level scores
```

The server never saves or logs what the user types, and the AI provider is only sent the
de-identified text. **My Medicines** and **Calendar** are kept only in that browser tab
(sessionStorage): they survive a refresh and are deleted when the tab is closed. Text size and
default options are remembered in the browser (localStorage). Calendar reminders can also be
downloaded as an `.ics` file, so no Google login is needed.

## Pages

- **Simplify**: paste instructions, get *My Care Plan*, then choose **Save to My Medicines and
  Calendar** after checking the suggested reminder times.
- **My Medicines**: saved medicines. Edit, remove, or add by hand. The original words never change.
- **Calendar**: a day-by-day list of dose reminders and appointments. Add, edit, remove, or
  download everything for Google / Apple / Outlook Calendar.
- **Settings**: text size, default language and reading level, delete saved data.

## Run it on your computer (Windows / VS Code)

You need Python 3.11+ and Node.js 20+.

**1. Backend** (first terminal):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env
uvicorn app.main:app --reload
```

**2. Frontend** (second terminal):

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. It starts in **demo mode**: no AI is connected, and the
"Hospital discharge" example shows a hand-written answer so you can work on the design.

## Connect a free AI model

1. Get a free key from **Google AI Studio** (https://aistudio.google.com/apikey) or
   **Groq** (https://console.groq.com/keys).
2. In `backend/.env` (not `.env.example`, which gets committed), set `AI_PROVIDER=gemini`
   (or `groq`) and paste the key.
3. Restart the backend.

Model names change often. If you get a "model not found" error, check the provider's
list of free models and update `GEMINI_MODEL` / `GROQ_MODEL`.

**Privacy:** free tiers may let the provider review or keep what you send. That is fine
for made-up examples and another reason never to use real patient data. Tell physician
testers this too.

**Paid model later:** add a class to `backend/app/providers.py` with the same
`complete_json` method and register it in `get_provider()`. Nothing else changes.

## Tests and evaluation

```powershell
cd backend
pytest                              # safety-check and privacy unit tests
python -m eval.run_eval             # runs all cases in eval/cases.json through the AI
python -m eval.run_eval --only warfarin
```

`eval/cases.json` holds made-up test cases, each listing details that **must** appear
in the output and things that must **not** (invented brand names, doubled doses, and
so on). Every run is saved to `eval/results/`. Rerun it whenever you change
`app/prompt.py` and compare. These tables can go straight into the research paper.

Add more cases. Aim for 20+, including tricky ones (liquid mL vs mg doses, tapers,
"every 4-6 hours", conflicting instructions).

## Deploy (free) for physician testing

The backend can serve the built website, so one free **Render** web service is enough:

- **Build command:** `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
- **Start command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*"`
- **Environment variables:** `AI_PROVIDER`, the API key, and `ALLOWED_ORIGINS` set to your Render URL

Free Render services sleep when idle, so the first visit can take about 30 seconds.

## Project layout

```
backend/
  app/main.py          API routes, rate limit, serves the built site
  app/prompt.py        AI instructions (where most tuning happens)
  app/schemas.py       the structured care plan the AI must return
  app/safety.py        rule-based check that no critical detail was lost
  app/pii.py           removes personal details before the AI sees the text
  app/readability.py   Flesch-Kincaid before/after scores
  app/providers.py     Gemini, Groq, demo mode
  eval/                test cases and evaluation runner
  tests/               unit tests
frontend/
  src/components/      input page, care plan, medicine cards, reminders, ...
  src/ics.js           calendar file builder
  src/styles.css       sage green, cream and antique gold theme matched to the logo
```

## Next steps

- [ ] Save the logo (cropped to just the cream rectangle) as `frontend/public/logo.png`
- [ ] Connect a free AI key and run the evaluation
- [ ] Grow `eval/cases.json` to 20+ cases
- [ ] Feedback page or Google Form for testers (comprehension questions + ratings)
- [ ] Deploy to Render and share with physician testers
- [ ] Live calendar sync (Google Calendar API) once users can sign in; the `.ics` download covers the demo
- [ ] Missed-dose helper (only restating what the label says)
- [ ] "Family Echo" caregiver view (needs accounts, so version 2)
