# Phase 3 — Motivation, offline, weather, polish (runs in a Ralph loop)

You are finishing Nate Miller's 10-mile training tracker. This same prompt is fed to you again on every iteration, and you remember nothing between iterations except what is in the files. Read them first, every time.

## What exists

- `PLAN.md` — the training plan. Only source of training content. Never change its content.
- `SITE_SPEC.md` — what the site is and how it must behave.
- `DECISIONS.md` — what Nate has already decided. Never re-ask these.
- `PROGRESS.md` — the checklist and log. The "Phase 3" section is your scope.
- `CLAUDE.md` — how to test and deploy.
- A working core from Phase 2: plan data, Today, logging, shin engine, Week, Library, Safety, storage.

## What this phase is for

Phase 2 made it correct. This phase makes him want to open it. Nate is burnt out on routine and is motivated by measurable milestones, so the Progress screen and the route line are the heart of the product, not decoration. Read `SITE_SPEC.md` sections 3 and 6 again before designing anything.

The site also has to work in a cold parking lot with no signal, and it has to tell him whether to run outside. Those are this phase too.

## Each iteration

1. Read `PROGRESS.md`, `DECISIONS.md`, and the last few log entries.
2. Take the next unchecked Phase 3 item.
3. Build it.
4. Verify it for real:
   - **Track B:** tests must reproduce the worked example in `PLAN.md` section 8 exactly, plus a red-status trigger and a late (December) trigger.
   - **Milestones and gates:** tests with sample logs, including a treadmill run (counts), a run with walk breaks (doesn't count for nonstop), and a skipped weekday run (doesn't fail the gate).
   - **Offline:** with Playwright, load the site, go offline, reload, and confirm Today renders and a log entry saves.
   - **Weather:** confirm the forecast service is free, needs no key, and allows browser requests before depending on it. Test the verdict logic against the table in `PLAN.md` section 6 with mocked responses, and test that a failed fetch falls back to the manual switch.
   - **Verses:** the text comes from a public-domain KJV source file and a test checks each verse against that source. Never type scripture from memory.
   - **Screens:** Playwright screenshots at 390 × 844 in dark and light themes, with a seeded sample log so charts and milestones have data. Open the screenshots and critique them honestly against `SITE_SPEC.md` section 3. Look for cramped tap targets, low contrast, text that wraps badly, and anything that reads as a generic template.
5. Fix what you found. Re-verify.
6. Tick the box, add a dated one-line log entry (what changed, how you verified it, what's still weak), and commit.
7. Push when a chunk is working and confirm it on the live URL.

## The polish pass

Before finishing, go through every screen once more as Nate at 6:10am and once as Nate on a Saturday after his longest run ever. On the first, he needs the answer in five seconds. On the second, the site should make the achievement visible. Fix what falls short of either.

Existing saved data must survive every deploy. If you change the storage shape, write a migration and test it against data saved by the previous version.

## Asking Nate

Use AskUserQuestion only when a decision is truly his: taste, his data, his schedule, or anything that would change plan content. First check `DECISIONS.md`. After he answers, write it to `DECISIONS.md`. Don't ask about implementation choices.

If you are blocked on something only he can do, write it at the top of `PROGRESS.md` under "Blocked — needs Nate," move on, and keep going.

## Finishing

Phase 3 is complete only when every Phase 3 box in `PROGRESS.md` is ticked, `npm test` passes, the live URL shows the finished site, it installs to a phone home screen and opens offline, and you have looked at fresh screenshots of every screen in both themes.

When that is all true, and only then, output exactly:

<promise>PHASE 3 COMPLETE</promise>

Do not output that line to get out of the loop. If something is unfinished or failing, say so in the log and keep working. If you hit the same failure three iterations in a row, write down what you tried under "Blocked — needs Nate" and move to the next item.
