# 10-Mile Tracker — Site Spec

A personal training site for Nate Miller (GitHub: `nathanmiller48`). It turns `PLAN.md` into something he opens on his phone every morning, usually before 6:30am, half awake, about to train.

`PLAN.md` is the only source of training content. This file says what the site does with it. Where the two seem to conflict, `PLAN.md` wins on training facts and this file wins on product behavior.

## 1. Who uses it and when

- One user. No accounts, no login.
- Phone first (design at 390 × 844). It should also be usable on a laptop, but nothing is designed for desktop first.
- Typical visit: 6:00–6:30am, dark room, 20 seconds. He needs to know what today is, whether to go outside, and when he has to be done. Then a second visit after the session to log it, which should take under 30 seconds.
- He is motivated by measurable milestones and bored by gym routine. The site's job is to make progress visible and make each day feel like a step on a route, not a chore list.

## 2. Hard constraints

- Free hosting on **GitHub Pages**, deployed from a public repo under `nathanmiller48`. Default repo name `10-mile-tracker` → `https://nathanmiller48.github.io/10-mile-tracker/`.
- **Static site, no backend, no build step required to deploy.** Plain HTML, CSS and JavaScript ES modules served from the repo. Dev-only tooling (test runner, Playwright) is fine and stays out of what Pages serves.
- All paths relative, so it works under the `/10-mile-tracker/` subpath.
- **Data lives on the phone** in `localStorage` under one versioned key. Export and import as a JSON file from Settings. Never lose the log on a redeploy.
- **Installable and offline.** Web app manifest, icons, and a service worker that caches the app shell so it opens with no signal. When a new version is deployed, the next open picks it up without him clearing anything.
- Fast: first paint of Today under 1 second on a warm load. No web fonts that block rendering. No frameworks.
- Accessibility: tap targets ≥ 48 px, body text ≥ 16 px, contrast ≥ 4.5:1, works with reduced-motion.
- Shin status colors (green, yellow, red) are used **only** for shin status, always paired with a word, never color alone.
- A one-line "Not medical advice" note sits on the Safety screen and under any shin banner.

## 3. Design direction

The concept is a **route**. Ten miles drawn as a line with mile markers, and his longest nonstop run fills it in. That line is the identity of the site: it appears as a slim strip on Today and as the hero on Progress.

- Dark by default. Near-black background, off-white text, one warm accent for action and progress. A light theme exists and follows the system setting, with a manual override in Settings.
- Big numerals, tabular figures, system font stack.
- Bottom tab bar, thumb reach: **Today · Week · Progress · Library · More**.
- Calm, not gamified. Milestones are marked like points on a map being reached, with a short satisfying moment when one unlocks. No confetti storms, no streak-shaming, no exclamation marks.
- Copy is short and plain, sentence case, written the way a good coach texts: "Easy 3. Full sentences the whole way." Buttons say what they do: "Log run," "Use treadmill instead."

Visual specifics beyond this (exact palette, the route drawing, icon) are Claude Code's to design well. Ask Nate only for taste calls listed in section 8.

## 4. Screens

### Today (default)
Top to bottom:
1. **Header:** date, "Week 3 of 8," Track A or B chip, days to target date.
2. **Morning shin check** — shown only on a morning after a run that has no next-morning score yet. One row of 0–10 buttons. Answering it updates shin status immediately. This comes first because it decides what today is.
3. **Shin banner** — only when status is yellow or red. States the status and the exact action from `PLAN.md` section 7.
4. **Conditions line** — feels-like temperature and precipitation for the chosen location at the planned session time, with the fallback verdict from `PLAN.md` section 6: "Run outside" or "Treadmill today: freezing rain." Shown on run days only. If the forecast can't be fetched, show a manual "Icy or too cold? Use fallback" switch instead.
5. **Morning session card:** name, total minutes, **"Done by 7:30"** (from the weekly template; Wed 7:00, Mon 11:15, none on Thu/Sat/Sun), and the session steps. Strength sessions show the exercise table with last time's weight × reps beside each tracked lift. Run sessions show distance, the three form cues, and the stop rule. One primary button: **Log it**.
6. **Evening card:** the climb for today and its limits, or "Off."
7. **Next milestone strip:** "Saturday: first 5-miler. 2 days."
8. **Route strip:** the 10-mile line, filled to his longest nonstop run.
9. **Verse of the day:** one KJV verse with reference, small, at the bottom. Can be turned off in Settings.

Before the plan starts or after it ends, Today shows a sensible state, not an error.

### Logging
A bottom sheet, one screen, no typing required for the common case.
- **Run:** distance (prefilled with the plan), time, nonstop yes/no, surface (road / treadmill / cross-train), effort 1–10, shin during 0–10, notes. Pace is calculated.
- **Strength:** checkbox per exercise, weight × reps for the tracked lifts, optional notes.
- **Climb:** done, hard/medium/easy, elbow or finger ache 0–10 (optional).
- **Recovery / walk:** done.
- **Benchmark days** add the benchmark's field to that day's log.
- Any day can be logged late or edited. Skipping is a state too ("Skipped — exams"), and it is never shamed.

### Week
Seven rows, Monday to Sunday, with the session, planned miles, and done / skipped / upcoming. Swipe or arrows between weeks. Weekly planned vs. actual miles at the top. Tapping a day opens that day in the Today layout.

### Progress
1. **The route:** 10 miles, markers at each milestone distance, filled to longest nonstop run. Planned line for his track vs. actual.
2. **Milestones:** all of `PLAN.md` section 10, reached ones dated, next one highlighted.
3. **Long-run chart:** each Saturday, planned vs. actual.
4. **Total miles:** running total against the plan.
5. **Shin trend:** during and next-morning scores per run. This is how he and a doctor can see what's happening.
6. **Benchmarks:** each one as first → latest, with the target.
7. **Track status:** which gates passed each week.

### Library
Every session type and exercise from `PLAN.md` section 5 with sets, reps, and notes, plus the ice/cold table and attempt-day plan. Searchable is unnecessary; a clean list is enough.

### More
- **Safety:** the shin rules table, the two self-checks, and the full see-a-doctor list. Always one tap from anywhere a shin banner appears.
- **Settings:** location for weather (Almont, Shelby Township, East Lansing, with East Lansing auto-selected on Wednesdays), theme, verse on/off, export, import, switch track, reset.
- **About:** sources from `PLAN.md` section 11 as links.

## 5. Logic the site must get right

### Plan data
Generated from the schedule table in `PLAN.md` section 4. 50 days, Nov 12 – Dec 31, 2026. Tests assert the day count, weekly totals, and the long-run sequence against the numbers printed in `PLAN.md`.

### "Today"
Uses the phone's local date. A `?date=YYYY-MM-DD` query parameter overrides it for testing and for looking ahead.

### Shin status engine
Pure function of the log, implementing `PLAN.md` section 7 exactly:
- Green, yellow, red from the latest run's during score, its next-morning score compared with the previous morning score, and the three-run creeping-up rule.
- Yellow: the next scheduled run converts to a cross-train session of the same minutes, a 48–72 hour no-run window is shown, and the site proposes Track B.
- Red: all runs become cross-train, the doctor list is shown, and running stays locked until he records 5 consecutive pain-free days and confirms he is cleared to restart.
- He can always override, but an override takes a deliberate second tap and is recorded.

### Gates and Track B
- Each Sunday the site evaluates the four gates in `PLAN.md` section 4 and shows the result.
- On a failed gate it explains which one and offers the switch. Switching is his decision, one tap, reversible in Settings.
- Track B's schedule is generated by the rules in `PLAN.md` section 8 from the trigger date and last green long run. Tests must reproduce the worked example in that section exactly.
- Fixed-date adjustments (finals, Thanksgiving, Christmas) carry over on Track B.

### Weather
Client-side fetch from a free, keyless, CORS-enabled forecast API (Open-Meteo is the expected choice; verify its terms and CORS behavior before depending on it). Cache the last result. Fail silently to the manual switch. No location permission prompt; use the three fixed locations.

### Milestones
Derived from the log, never manually toggled. A treadmill run counts. A cross-train session or a run with walk breaks does not count toward nonstop-distance milestones but does count for consistency.

### Verse of the day
KJV only (public domain). At least 60 verses on endurance, strength, perseverance, discipline, and rest. The text must be copied from a public-domain KJV source file and checked against it, not written from memory. Chosen deterministically by date.

## 6. What it should feel like at 6:10am

He unlocks the phone, taps the icon, and without scrolling sees: "Tuesday. Easy 3. Done by 7:30. 24°F feels 15, roads dry. Run outside." Underneath, the route line is a little longer than last week and says "Saturday: first 10K. 4 days." That's the product.

## 7. Out of scope

Accounts, sync, social sharing, Strava import, notifications, nutrition tracking, AI chat, anything needing a server.

## 8. Decisions that are Nate's (ask with AskUserQuestion)

Ask these in Phase 1, record answers in `DECISIONS.md`, and don't ask again:
1. Repo name: `10-mile-tracker` or something else.
2. Accent color direction, shown as 3–4 named options with swatches described.
3. Default weather location for non-Wednesday days: Almont or Shelby Township (he alternates weekly; offer "ask me each Sunday" as an option).
4. Verse of the day: on by default or off.
5. Anything in his existing `bjj-tracker` site he specifically wants carried over or avoided.

Later, ask only when a decision is truly his: something about taste, his data, his schedule, or a change to plan content. Do not ask about implementation choices, and never change training content from `PLAN.md` without asking.
