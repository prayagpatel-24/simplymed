# SimplyMed

A student research prototype that turns confusing prescription labels and discharge
instructions into a plain-language **My Care Plan**: medicines, what to do, when to get
help, a checklist, calendar reminders, and questions to ask, with the original words
always one click away.

> Not medical advice. Use made-up examples only. Never enter real patient information.

## How it works

```
Browser (React)  ->  FastAPI backend  ->  AI model (Gemini / Groq, free tiers)
       |                |
       |                |-- 1. removes names, birth dates, phone numbers, record numbers;
       |                |      ages 90+ are sent as "90 or older"
       |                |-- 2. asks the AI for a structured care plan (JSON, bullet points)
       |                |-- 3. rule-based safety check: every number, dose, unit,
       |                |      frequency and warning in the original must still be there
       |                '-- 4. before/after reading-level scores
       |
       '--> Supabase (optional): sign-in, saved medicines, calendar, age, text size, feedback
```

**Privacy.** The server never saves or logs what the user types, and the AI is only sent the
de-identified text. Signed-in users' medicines, calendar, age and text size are saved in
Supabase, protected by Row Level Security so each person only sees their own. Without an
account, they are kept only in that browser tab and deleted when it closes. The full pasted
text is never saved on a server; a saved medicine keeps only its own original-words excerpt
so the original stays one click away.

**Age.** An optional age (never a birth date) is used only to speak to a caregiver when the
patient is under 18, and to add age-specific *questions to ask* the pharmacist. The AI does
not add age-specific doses, side effects or risks that are not in the original, because the
safety check cannot verify them.

## Pages

- **Simplify**: paste instructions and an optional age, get *My Care Plan*, then choose
  **Save to My Medicines and Calendar** after checking the suggested reminder times.
- **My Medicines**: a table of saved medicines. Edit, remove, show the original words, or add by hand.
- **Calendar**: Month view (tap a day to add, edit or remove) and Week view. Download everything
  as an `.ics` file for Google / Apple / Outlook Calendar.
- **Help**: step-by-step guides, fixes for common errors, and the **SimplyMed helper** chatbot
  (explains the app and words in your care plan; never gives medical advice).
- **Feedback**: ease-of-use rating, "did it make sense?", comments. Saved to Supabase.
- **Settings**: text size (enlarges the words, not the layout), language, delete saved data.
- **Account**: sign up, sign in, reset password, or continue without an account.

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
copy .env.example .env      # optional: add Supabase values to test accounts
npm run dev
```

Open http://localhost:5173. Without an AI key it runs in **demo mode**: the "Hospital
discharge" example shows a hand-written answer. Without Supabase values it runs in
**guest mode**: no accounts, and nothing is kept after the tab closes.

## Connect a free AI model

1. Get a free key from **Google AI Studio** (https://aistudio.google.com/apikey) or
   **Groq** (https://console.groq.com/keys).
2. In `backend/.env` (never `.env.example`, which is committed), set `AI_PROVIDER=gemini`
   (or `groq`) and paste the key.
3. Restart the backend.

Model names change often. If you get a "model not found" error, check the provider's
list of free models and update `GEMINI_MODEL` / `GROQ_MODEL`. If you keep getting "AI is
busy" (503), try a different model.

**Privacy:** free tiers may let the provider review or keep what you send. That is fine
for made-up examples and another reason never to use real patient data. Tell physician
testers this too.

**Paid model later:** add a class to `backend/app/providers.py` with the same
`complete_json` and `complete_text` methods and register it in `get_provider()`.

## Set up accounts (Supabase, free)

1. Create a project at https://supabase.com.
2. **SQL Editor -> New query**, paste all of `supabase/schema.sql`, and press **Run**.
3. **Project Settings -> API**: copy the **Project URL** and the **anon public** key into
   `frontend/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and into Vercel, below).
4. **Authentication -> URL Configuration**: set **Site URL** to your Vercel address (and add
   `http://localhost:5173` under Redirect URLs) so the email links come back to SimplyMed.
5. Optional for testing: **Authentication -> Providers -> Email**, turn off **Confirm email**
   so testers can sign in right away.

Feedback appears in **Table Editor -> feedback**, where you can export it to CSV.
Free projects pause after about a week without use; open the dashboard and resume it.

## Deploy (free) on Vercel

The website and the Python API run together on Vercel, so there is one address and no
separate server. The AI key stays in Vercel's settings, never in the website or GitHub.

1. Sign in at https://vercel.com with GitHub and **Add New -> Project**, then import this repo.
   Leave the settings as they are; `vercel.json` sets the build and the `/api` function.
2. Before deploying, open **Environment Variables** and add:
   - `AI_PROVIDER` = `gemini` (or `groq`), plus `GEMINI_API_KEY` and `GEMINI_MODEL`
     (or `GROQ_API_KEY`)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. **Deploy.** Every push to `main` redeploys. Check `https://<your-app>.vercel.app/api/health`.
4. If you used GitHub Pages before: GitHub repo **Settings -> Pages**, set Source to **None**.

## Tests and evaluation

```powershell
cd backend
pytest                              # safety check, privacy, age and chat tests
python -m eval.run_eval             # runs all cases in eval/cases.json through the AI
python -m eval.run_eval --only warfarin
```

`eval/cases.json` holds made-up test cases, each listing details that **must** appear
in the output, things that must **not** appear anywhere, and (for age cases) things that
must not be **stated** as fact outside the questions. Every run is saved to `eval/results/`.
Rerun it whenever you change `app/prompt.py` and compare. These tables can go straight into
the research paper.

Add more cases. Aim for 20+, including tricky ones (liquid mL vs mg doses, tapers,
"every 4-6 hours", conflicting instructions, children and adults 75+).

## Project layout

```
api/index.py           Vercel entry point for the backend
vercel.json            Vercel build + routing
supabase/schema.sql    database tables and privacy rules (paste into Supabase)
backend/
  app/main.py          API routes (/api/simplify, /api/chat), rate limit
  app/prompt.py        AI instructions (where most tuning happens)
  app/chat.py          Help page chatbot instructions and guardrails
  app/schemas.py       the structured care plan the AI must return
  app/safety.py        rule-based check that no critical detail was lost
  app/pii.py           removes personal details; groups ages 90+
  app/readability.py   Flesch-Kincaid before/after scores
  app/providers.py     Gemini, Groq, demo mode
  eval/                test cases and evaluation runner
  tests/               unit tests
frontend/
  src/components/      pages, care plan, medicines table, calendar, help, ...
  src/store.jsx        saved medicines/calendar/profile (Supabase or this tab)
  src/auth.jsx         sign in / sign up / password reset
  src/ics.js           calendar file builder
  src/styles.css       brighter sage and gold theme with a color per tab
```

## Next steps

- [ ] Connect a working AI key and run the evaluation (compare models)
- [ ] Create the Supabase project and deploy to Vercel
- [ ] Grow `eval/cases.json` to 20+ cases
- [ ] Share with physician testers; review feedback in Supabase
- [ ] Live calendar sync (Google Calendar API); the `.ics` download covers the demo
- [ ] "Family Echo" caregiver view (accounts now exist, so this is possible)
