"""Run every synthetic test case through the real pipeline and score it.

    python -m eval.run_eval              (from the backend folder)
    python -m eval.run_eval --delay 6    (slower, for strict free-tier limits)
    python -m eval.run_eval --only warfarin

Results are saved to eval/results/ so you can compare prompt versions over time
(and use the numbers in the research paper).
"""

import argparse
import asyncio
import json
from datetime import datetime
from pathlib import Path

from app.pipeline import PlanParseError, simplify
from app.providers import ProviderError, get_provider
from app.safety import normalize, plan_text
from app.schemas import CarePlan

EVAL_DIR = Path(__file__).parent


async def run(delay: float, only: str | None) -> None:
    cases = json.loads((EVAL_DIR / "cases.json").read_text(encoding="utf-8"))
    if only:
        cases = [c for c in cases if c["id"] == only]
    provider = get_provider()
    print(f"Provider: {provider.name} ({provider.model}) - {len(cases)} cases\n")

    rows, details = [], []
    for i, case in enumerate(cases):
        if i:
            await asyncio.sleep(delay)
        try:
            result = await simplify(case["text"], "en", "very_simple", provider)
        except (ProviderError, PlanParseError) as e:
            rows.append((case["id"], "ERROR", "-", "-", "-", str(e)[:60]))
            print(f"  {case['id']}: ERROR {e}")
            continue

        text = normalize(plan_text(CarePlan.model_validate(result["plan"])))
        full = json.dumps(result["plan"]).lower()
        missing = [s for s in case["must_include"] if normalize(s) not in text]
        forbidden = [s for s in case["must_not_include"] if s.lower() in full]
        safety = result["safety"]
        read = result["readability"]
        grade = f'{read["original"]["grade"]} -> {read["simplified"]["grade"]}'
        high = [x["message"] for x in safety["issues"] if x["severity"] == "high"]
        ok = not missing and not forbidden and safety["passed"]

        rows.append((case["id"], "PASS" if ok else "FAIL", grade, len(missing) + len(forbidden),
                     len(high), "; ".join(missing + [f"has '{f}'" for f in forbidden])[:60]))
        details.append({"case": case["id"], "missing": missing, "forbidden_found": forbidden,
                        "safety_issues": safety["issues"], "readability": read, "plan": result["plan"]})
        print(f"  {case['id']}: {'PASS' if ok else 'FAIL'}  grade {grade}")

    header = ("case", "result", "FK grade (before -> after)", "expectation misses", "safety flags", "notes")
    table = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    table += ["| " + " | ".join(str(c) for c in row) + " |" for row in rows]
    passed = sum(r[1] == "PASS" for r in rows)

    out_dir = EVAL_DIR / "results"
    out_dir.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    (out_dir / f"{stamp}-{provider.name}.md").write_text(
        f"# Eval {stamp}\n\nProvider: {provider.name} ({provider.model})\n\n"
        f"**{passed}/{len(rows)} passed**\n\n" + "\n".join(table) + "\n",
        encoding="utf-8",
    )
    (out_dir / f"{stamp}-{provider.name}.json").write_text(json.dumps(details, indent=2), encoding="utf-8")
    print(f"\n{passed}/{len(rows)} passed. Saved to eval/results/{stamp}-{provider.name}.md")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--delay", type=float, default=4.0, help="seconds between cases")
    parser.add_argument("--only", help="run a single case id")
    args = parser.parse_args()
    asyncio.run(run(args.delay, args.only))
