# How to build the site with Claude Code

Four steps. Steps 1 and 4 need you at the keyboard for about 10 minutes each. Steps 2 and 3 run on their own.

## Before you start

1. Make an empty folder, for example `~/code/10-mile-tracker`.
2. Put these five files in it: `PLAN.md`, `SITE_SPEC.md`, `PHASE_1.md`, `PHASE_2.md`, `PHASE_3.md`.
3. Open a terminal in that folder and start Claude Code.
4. Make sure the GitHub plugin is signed in as `nathanmiller48`.

## Step 1 — Setup and decisions (interactive)

Paste this as a normal message, not a Ralph loop:

```
Read PHASE_1.md and follow it exactly.
```

It will look at your bjj-tracker site, ask you about five questions, create the repo, and put a placeholder live on GitHub Pages. Stay for this one. When it reports the live URL, open it on your phone to confirm it loads.

## Step 2 — Build the core (loop)

```
/ralph-loop "Read PHASE_2.md and follow it exactly." --max-iterations 25 --completion-promise "PHASE 2 COMPLETE"
```

Walk away. It stops when the core is done and tested, or at 25 iterations. When it stops, open `PROGRESS.md`. If there's a "Blocked — needs Nate" section at the top, deal with that and run the same command again; it picks up where it left off.

Check on your phone: does Today show the right session for today's date, and can you log it?

## Step 3 — Motivation, offline, weather, polish (loop)

```
/ralph-loop "Read PHASE_3.md and follow it exactly." --max-iterations 25 --completion-promise "PHASE 3 COMPLETE"
```

Same as step 2. Rerun if it stops early.

## Step 4 — Your review (interactive)

Open the live site on your phone, add it to your home screen, and use it for one real morning. Then paste this with your notes filled in:

```
Read PLAN.md, SITE_SPEC.md, DECISIONS.md and PROGRESS.md. I've used the live site on my phone. Here is what I want changed:

- [your notes]

For each item, tell me what you'll change, ask me with AskUserQuestion if there's a real choice to make, then make the changes, run the tests, take 390x844 screenshots of what changed, and deploy. Don't change any training content in PLAN.md unless I've asked for it above.
```

## If you want it usable sooner

Step 2 alone gives you a working daily tracker. Do steps 1 and 2 tonight, start using it, and run step 3 whenever.

## If the plan changes

Edit `PLAN.md`, then tell Claude Code:

```
PLAN.md has changed. Regenerate the plan data from it, update the tests to match its printed totals, run them, and deploy. My saved log must survive.
```

## Why it's split this way

- Questions happen in step 1 because a loop that stops to ask a question just sits there until you notice.
- Each loop's prompt is a file because the loop feeds the same prompt back every iteration, and a file keeps the command short and lets the prompt point at a checklist that tracks state between iterations.
- Correctness (plan data, shin rules) is built and tested before anything visual, since you'll be acting on what it says.
