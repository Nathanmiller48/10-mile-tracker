# Phase 2 — The working core (runs in a Ralph loop)

You are building Nate Miller's 10-mile training tracker. This same prompt is fed to you again on every iteration, and you remember nothing between iterations except what is in the files. So the files are your memory. Read them first, every time.

## What exists

- `PLAN.md` — the training plan. Only source of training content. Never change its content.
- `SITE_SPEC.md` — what the site is and how it must behave.
- `DECISIONS.md` — what Nate has already decided. Never re-ask these.
- `PROGRESS.md` — the checklist and log. The "Phase 2" section is your scope.
- `CLAUDE.md` — how to test and deploy.

## Why this matters

Nate will open this on his phone before 6:30am, about to train, with a history of shin injury. If the site shows the wrong session, the wrong distance, or the wrong shin advice, he acts on it. Correct plan data and a correct shin engine matter more than anything visual in this phase. Tests on those two are not optional.

## Each iteration

1. Read `PROGRESS.md`, `DECISIONS.md`, and the last few log entries.
2. Take the next unchecked Phase 2 item. One item, done properly, beats three half-done.
3. Build it.
4. Verify it for real:
   - Logic: write or extend tests and run `npm test`. Plan data must match the totals and long-run sequence printed in `PLAN.md`. The shin engine must have a test for every row of the table in `PLAN.md` section 7, including the creeping-up rule and the red lock.
   - Screens: take Playwright screenshots at 390 × 844 using the `?date=` override on at least three different kinds of day (a run day, a strength day, the morning after a run), then open and look at the screenshots. Ask whether a half-awake person could tell in five seconds what to do today and when to be done.
5. Fix what you found. Re-verify.
6. Tick the box, add a dated one-line log entry (what changed, how you verified it, what's still weak), and commit.
7. When a meaningful chunk is working, push and confirm the live GitHub Pages URL shows it.

## Asking Nate

Use AskUserQuestion only when a decision is truly his: taste, his data, his schedule, or anything that would change plan content. First check `DECISIONS.md`. After he answers, write the answer to `DECISIONS.md` so no later iteration asks again. Don't ask about implementation choices; make them and note them in the log.

If you are blocked on something only he can do (credentials, a permission), write it at the top of `PROGRESS.md` under "Blocked — needs Nate," move to another item, and keep going.

## Finishing

Phase 2 is complete only when every Phase 2 box in `PROGRESS.md` is ticked, `npm test` passes, the live URL shows the working site, and you have looked at fresh screenshots of Today, logging, Week, Library, and Safety.

When that is all true, and only then, output exactly:

<promise>PHASE 2 COMPLETE</promise>

Do not output that line to get out of the loop. If something is unfinished or failing, say so in the log and keep working. If you reach the same failure three iterations in a row, write down what you tried under "Blocked — needs Nate" and move to the next item.
