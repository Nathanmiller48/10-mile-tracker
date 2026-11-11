# Progress

Checklist for Phases 2 and 3, taken from `SITE_SPEC.md` and adjusted by `DECISIONS.md`. One item per sitting. Tick a box only after the stated verification has actually passed. "Screenshot" always means Playwright at 390 × 844, opened and looked at.

## Blocked — needs Nate

_Nothing right now._

## Phase 1 — done

- [x] Reviewed bjj-tracker for reference (notes in `DECISIONS.md`)
- [x] Section 8 decisions asked and recorded in `DECISIONS.md`
- [x] Static scaffold, placeholder page, `npm test` (unit + Playwright)
- [x] `PROGRESS.md` and `CLAUDE.md`
- [x] Public repo created, pushed, GitHub Pages live and checked at 390 × 844

## Phase 2 — the working core

### Plan data
- [x] **P2-01 Parse the schedule.** `scripts/build-plan.mjs` reads the section 4 table in `PLAN.md` and writes `js/data/plan.js` (date, weekday, week, morning session IDs, modifiers like "lite"/"light", run miles, evening session, optional flag, notes, benchmark and milestone tags). The generated file is committed; Pages needs no build. _Verify:_ unit tests assert 50 days, first day 2026-11-12, last 2026-12-31, no gaps or duplicates, weekdays match the dates.
- [x] **P2-02 Totals match the plan.** _Verify:_ unit tests assert weekly totals 6 / 10 / 12.2 / 13.5 / 11 / 15.5 / 13 / 12, total 93.2, and long-run sequence 4, 5, 6.2, 7, 5, 8.5, 6, 10 (last one on Thu Dec 31), all read from the numbers printed in `PLAN.md`, plus a test that fails if `plan.js` is stale relative to `PLAN.md`.
- [x] **P2-03 Session library data.** `js/data/sessions.js` holds every session type from `PLAN.md` section 5 (RUN-E, RUN-L, STR-A, ARM-B, PULL, CLIMB-H/M/E, RESET, AER, WALK) with steps, exercise tables, sets × reps, notes, durations, and the per-week set adjustments (weeks 1–2 two sets, week 5 lite, etc.), plus the "Done by" times from the weekly template (Mon 11:15, Tue 7:30, Wed 7:00, Fri 7:30, none Thu/Sat/Sun). _Verify:_ unit tests check every session ID used in `plan.js` resolves, exercise counts match the tables (STR-A 8, PULL 6, ARM-B 5), and done-by times per weekday.
- [x] **P2-04 Benchmarks and milestone definitions as data** from `PLAN.md` section 10 (dates, targets, how measured). _Verify:_ unit tests for the benchmark dates and the 13 milestones with their planned dates.

### Storage
- [x] **P2-05 Storage module.** One versioned `localStorage` key, schema version field, safe load on missing or corrupt data, migration hook. Log entries keyed by date and slot (morning / evening / next-morning shin). _Verify:_ unit tests with a fake storage: round trip, corrupt JSON falls back without throwing, version bump runs a migration.
- [ ] **P2-06 Export and import.** Settings buttons download the log as a JSON file and load one back, with validation and a confirm before overwrite. _Verify:_ unit test for validate/merge; Playwright test exports, clears, imports, and sees the same entries.

### App shell and dates
- [ ] **P2-07 Shell and navigation.** Bottom tab bar Today · Week · Progress · Library · More with hash routing, 48 px targets, safe-area padding. Progress may be a stub until Phase 3. _Verify:_ Playwright taps each tab and checks the heading; screenshot.
- [ ] **P2-08 "Today" date logic.** Phone's local date, `?date=YYYY-MM-DD` override, week number, days to target, and sensible before-plan (≤ Nov 11) and after-plan (≥ Jan 1) states. _Verify:_ unit tests for date math across the Nov→Dec boundary and both out-of-range states; screenshots for `?date=2026-11-11` and `?date=2027-01-02`.

### Shin status engine
- [x] **P2-09 Status from the log.** Pure function implementing `PLAN.md` section 7: green / yellow / red from the latest run's during score, the next-morning score vs. the previous morning score, and creeping up across three runs in a row. The next-morning rule follows `DECISIONS.md` item 6 (green if no higher than the previous morning and ≤ 2; yellow if higher or ≥ 3). _Verify:_ unit tests for every row of the section 7 table, each yellow trigger separately, the item 6 cases (1 after 1 is green, 2 after 1 is yellow, 3 after 3 is yellow), the creeping-up rule, boundaries (2 vs 3, 4 vs 5), and no-data-yet.
- [ ] **P2-10 Consequences.** Yellow: next scheduled run becomes cross-train of the same minutes, 48–72 h no-run window shown, strength calf/tibialis notes drop to bodyweight, Track B proposed. Red: all runs become cross-train, doctor list shown, running locked until 5 consecutive pain-free days are recorded and he confirms he is cleared. _Verify:_ unit tests for the conversion, the window, the red lock and its release (4 days does not unlock, 5 plus confirmation does).
- [ ] **P2-11 Override.** He can override a lock with a deliberate second tap; the override is recorded in the log. _Verify:_ unit test that an override is stored with date and reason; Playwright test that one tap does nothing and the second does.

### Today screen
- [ ] **P2-12 Header and session cards.** Date, "Week N of 8", Track chip, days to target; morning card with name, minutes, "Done by", steps, and one **Log it** button; evening card with the climb and its limits, or "Off". Run cards show distance, the three form cues, and the stop rule. _Verify:_ screenshots for a run day (`2026-11-17`), a strength day (`2026-11-16`), a long-run day (`2026-12-05`), a walk day (`2026-12-25`); check a half-awake person gets the answer in five seconds without scrolling.
- [ ] **P2-13 Strength cards.** Exercise table with tap-to-expand notes (carried over from bjj-tracker) and last time's weight × reps beside each tracked lift. _Verify:_ Playwright seeds a prior log, checks the "last time" values, expands a row; screenshot.
- [ ] **P2-14 Morning shin check and shin banner.** 0–10 row shown only the morning after a run with no next-morning score; answering updates status at once. Banner for yellow/red with the exact action from section 7, the word for the status (never color alone), a "Not medical advice" line, and a link to Safety. _Verify:_ Playwright on the morning after a run (`2026-11-18` with a seeded Nov 17 run): tap a score, banner appears/doesn't per score; screenshots of green, yellow, red.
- [ ] **P2-15 Manual fallback switch.** On run days, "Icy or too cold? Use fallback" switches the card to the treadmill instructions from `PLAN.md` section 6 (weather itself is Phase 3). _Verify:_ Playwright toggles it and checks the copy; screenshot.
- [ ] **P2-16 Next milestone strip and route strip.** "Saturday: first 5-miler. 2 days." and the 10-mile line filled to the longest nonstop run in the log. _Verify:_ unit test for longest-nonstop (treadmill counts, walk breaks and cross-train do not); screenshot with a seeded log.

### Logging
- [ ] **P2-17 Run log sheet.** Bottom sheet: distance (prefilled from plan), time, nonstop, surface (road / treadmill / cross-train), effort 1–10, shin during 0–10, notes; pace calculated. No typing needed for the common case. _Verify:_ unit test for pace; Playwright logs a run in under ~6 taps and reloads to see it persisted; screenshot.
- [ ] **P2-18 Strength log sheet.** Checkbox per exercise; weight × reps for trap-bar deadlift, split squat, single-leg calf raise, weighted pull-up; lock-off round count; notes. _Verify:_ Playwright logs STR-A and PULL, reloads, values persist; screenshot.
- [ ] **P2-19 Climb, recovery and walk logs.** Climb: done, hard/medium/easy, optional elbow/finger ache 0–10. RESET / AER / WALK: done. _Verify:_ Playwright logs each type; screenshot of the climb sheet.
- [ ] **P2-20 Benchmark fields.** Benchmark days add that benchmark's field (2-mile time, calf raise reps per side, pull-up weight, lock-off seconds per side). _Verify:_ Playwright on `2026-11-12`, `2026-11-13`, `2026-11-16` checks the extra field appears and saves.
- [ ] **P2-21 Late logging, editing, skipping.** Any day can be logged late or edited; "Skipped" with an optional reason is a neutral state. _Verify:_ Playwright edits a past entry and marks a day skipped; unit test that a skip is stored distinctly from "not logged".

### Week, Library, More
- [ ] **P2-22 Week screen.** Seven rows Mon–Sun with session, planned miles, done / skipped / upcoming; arrows and swipe between weeks; planned vs. actual miles on top; tapping a day opens it in the Today layout. Handles partial week 1 (Thu–Sun) and week 8 (Mon–Thu). _Verify:_ Playwright checks week 1, week 4, week 8 and day tap-through; screenshots.
- [ ] **P2-23 Library.** Every session and exercise from section 5 with sets, reps, notes (tap-to-expand), the ice/cold table (section 6), and the attempt-day plan (section 9). _Verify:_ unit test that every exercise name in `PLAN.md` section 5 tables appears in the rendered data; screenshot.
- [ ] **P2-24 Safety screen.** Shin rules table, both self-checks, the full see-a-doctor list including the compartment-syndrome pattern and the ER line, and "Not medical advice". Reachable in one tap from any shin banner. _Verify:_ unit test that all seven doctor-list items from section 7 are present; Playwright banner → Safety in one tap; screenshot.
- [ ] **P2-25 Settings (core) and History.** Export, import, reset (with confirm), switch track (manual toggle; generation is Phase 3), and a plain chronological History list of logged sessions (carried over from bjj-tracker). _Verify:_ Playwright for reset confirm and History order; screenshot.

### Ship
- [ ] **P2-26 Deploy and check live.** Push, wait for Pages, run `npm run test:live`, and look at fresh live screenshots of Today, logging, Week, Library, Safety. Confirm a log saved before the deploy is still there after it. _Verify:_ `npm test` and `npm run test:live` pass; screenshots viewed.

## Phase 3 — motivation and polish

### Progress screen
- [ ] **P3-01 The route (hero).** Ten miles with markers at each milestone distance (4, 5, 6.2, 7, 8.5, 10), filled to the longest nonstop run, with the planned line for his track vs. actual. _Verify:_ screenshot with a seeded log in dark and light; unit test for marker positions.
- [ ] **P3-02 Milestones.** All 13 from section 10, derived from the log only, reached ones dated, next one highlighted, with a short calm unlock moment (respects reduced motion; no confetti). _Verify:_ unit tests with sample logs: treadmill run counts, walk-break run does not count for nonstop, cross-train does not count, total-mile milestones at 25 / 50 / 75, "four straight green weeks"; screenshot.
- [ ] **P3-03 Long-run chart.** Each Saturday (and Dec 31), planned vs. actual. _Verify:_ screenshot with seeded data; values readable at 390 wide.
- [ ] **P3-04 Total miles.** Running total against the plan. _Verify:_ unit test for cumulative planned miles hitting 93.2; screenshot.
- [ ] **P3-05 Shin trend.** During and next-morning scores per run, readable enough to show a doctor; status colors used only here and in shin UI, always with words. _Verify:_ screenshot with seeded green/yellow data.
- [ ] **P3-06 Benchmarks.** Each as first → latest with the target. _Verify:_ screenshot with seeded benchmark entries; unit test for improvement calc.

### Gates and Track B
- [ ] **P3-07 Sunday gates.** Evaluate the four gates from section 4 for the week just finished and show which passed; a missed short weekday run for exams/travel does not fail, a missed Saturday long run does. _Verify:_ unit tests for each gate passing and failing, including the skipped-weekday case.
- [ ] **P3-08 Track B generator.** Pure function of trigger date, last green long run, and status (yellow/red), implementing section 8 rules 1–7. _Verify:_ unit tests reproduce the worked example exactly (Nov 28 → Jan 23: 4, 5, 6, 4.5, 7, 8, 8.5, 6, 10), plus a red trigger (starts at half) and a December trigger; weekday runs 40–45% rounded to 0.5, min 2, max 4; never past 8.5 before the attempt; hard cap Jan 30 surfaced.
- [ ] **P3-09 Track switch flow.** On a failed gate, explain which gate and offer the switch: one tap, his decision, reversible in Settings. Fixed-date adjustments (finals, Thanksgiving, Christmas) carry over on Track B. Today, Week and Progress all follow the active track. _Verify:_ Playwright fails a gate with a seeded log, switches, checks Week shows Track B, switches back; unit test for carried-over date notes.

### Weather
- [ ] **P3-10 Confirm the forecast service.** Check Open-Meteo is free for this use, keyless, and sends CORS headers; record what was checked in the Log. _Verify:_ a real browser fetch from the dev server succeeds; terms page read.
- [ ] **P3-11 Verdict logic.** Pure function from forecast (feels-like, precipitation type, snow) to the section 6 verdict: run outside / treadmill for ice, unplowed snow, freezing rain / treadmill below 0°F feels-like. _Verify:_ unit tests for every row of the section 6 table with mocked responses, including the 0°F boundary.
- [ ] **P3-12 Conditions line.** On run days, feels-like and precipitation at the planned session time for the chosen location (East Lansing by default every day; Almont and Shelby Township selectable — see `DECISIONS.md`). Cache the last result; on failure fall back silently to the manual switch. No location permission prompt. _Verify:_ Playwright with a mocked API for success, failure, and cached-offline; screenshot.

### Installable and offline
- [ ] **P3-13 Manifest and icons.** Web app manifest with relative paths, icons (192, 512, maskable, apple-touch), theme colors. _Verify:_ Playwright fetches the manifest and every icon (200s); icon looked at.
- [ ] **P3-14 Service worker.** Caches the app shell; a new deploy is picked up on the next open with no manual clearing; `localStorage` untouched. _Verify:_ Playwright loads, goes offline, reloads, Today renders and a log entry saves; a second test bumps the version and confirms the new shell is served.

### Verse of the day
- [ ] **P3-15 Verse data.** At least 60 **Berean Standard Bible** verses (public domain; see `DECISIONS.md`, not KJV) on endurance, strength, perseverance, discipline and rest, copied from a public-domain BSB source file kept in the repo under `tests/fixtures/`. _Verify:_ a unit test checks every verse's text against the source file by reference; count ≥ 60.
- [ ] **P3-16 Verse on Today.** Chosen deterministically by date, small at the bottom, on by default, toggle in Settings, reference links to that verse in ESV on esv.org. _Verify:_ unit test same date → same verse, consecutive dates differ; Playwright toggles it off; screenshot.

### Themes, polish, accessibility
- [ ] **P3-17 Themes.** Dark default, light follows the system, manual override in Settings (system / dark / light), coral accent holding 4.5:1 in both. _Verify:_ screenshots of every screen in both themes; contrast computed for text/accent pairs.
- [ ] **P3-18 Polish: Today and logging.** As Nate at 6:10am: answer in five seconds, nothing cramped, no bad wraps, not a generic template. _Verify:_ fresh screenshots critiqued against `SITE_SPEC.md` sections 3 and 6; fixes re-shot.
- [ ] **P3-19 Polish: Week, Library, More.** Same pass. _Verify:_ fresh screenshots in both themes.
- [ ] **P3-20 Polish: Progress.** As Nate on a Saturday after his longest run ever: the achievement is visible. _Verify:_ screenshots with a seeded log ending on a new longest run.
- [ ] **P3-21 Accessibility pass.** Tap targets ≥ 48 px, body text ≥ 16 px, contrast ≥ 4.5:1, reduced motion honored, labels on every control, focus visible, shin status never color alone. _Verify:_ Playwright test measures every interactive element on every screen and checks `prefers-reduced-motion`; manual keyboard pass.
- [ ] **P3-22 Performance check.** Warm-load first paint of Today under 1 s, no render-blocking fonts, no frameworks. _Verify:_ Playwright timing on a warm load, recorded in the Log.
- [ ] **P3-23 Storage migration safety.** If the storage shape changed since Phase 2, a migration exists. _Verify:_ unit test loads a fixture saved by the Phase 2 version and reads every entry.
- [ ] **P3-24 Final deploy.** Push, `npm run test:live`, confirm it installs to a home screen and opens offline, and look at fresh live screenshots of every screen in both themes. _Verify:_ all tests pass; screenshots viewed.

## Open questions for Nate

_None open. Answered ones live in `DECISIONS.md`._

## Log

- 2026-11-11 — Phase 1: reviewed bjj-tracker, recorded decisions (BSB instead of KJV; East Lansing every day), scaffolded static site with placeholder + route line, `npm test` passing (6 unit, 1 Playwright at 390 × 844, screenshot looked at). Checked the printed totals in `PLAN.md` by hand: 50 days, weekly totals and 93.2 all add up; the Track B worked example follows the rules as written.
- 2026-11-11 — Phase 1: repo created, Pages enabled from `main` root, `npm run test:live` passed against https://nathanmiller48.github.io/10-mile-tracker/ and the live 390 × 844 screenshot was looked at. Next-morning shin rule ambiguity settled (`DECISIONS.md` item 6); P2-09 must test it. Weak spot to watch in P3-08: section 8 does not say which wins when a "4th week" cutback and the post-8.5 "6 then 10" rule land on different Saturdays (they coincide in the worked example); if a December or red trigger exposes it, ask Nate.
- 2026-11-11 — P2-01, P2-02: `scripts/build-plan.mjs` parses the section 4 table into `js/data/plan.js` (sessions, modifiers, optional climbs, miles, notes, benchmark and milestone tags) and fails loudly on anything it does not recognise. Verified by 9 unit tests: 50 days, calendar weekdays, weekly totals and 93.2 read from the line printed in `PLAN.md`, long-run sequence, staleness check. Weak: milestone tags are free text from the notes; P2-04 adds the structured section 10 list.
- 2026-11-11 — P2-03, P2-04: `scripts/build-content.mjs` turns `PLAN.md` sections 3–11 into `js/data/content.js` (11 sessions with exercise tables and durations, weekly template with done-by times, gates, fallback table, shin rules, doctor list, Track B text, attempt day, 5 benchmarks, 13 milestones with rules, sources). `npm run build:data` regenerates both data files. Verified by 11 unit tests, including that every exercise name/dose appears verbatim in `PLAN.md` and that the planned milestone dates fall out of the schedule. Weak: the per-week set changes ("Weeks 1–2: 2 sets…") are carried as text only; P2-13 must turn them into per-day set counts with a test.
- 2026-11-11 — P2-05: `js/storage.js`, one key `ten-mile-tracker` with a version inside; corrupt data is copied to `.corrupt` and never thrown on; export/import text helpers. 10 unit tests with a fake storage. No migrations exist yet (version 1).
- 2026-11-11 — P2-08 (logic half): `js/dates.js`, UTC date math, local "today", `?date=` override, plan position, Monday–Sunday weeks. 7 unit tests incl. month boundaries and before/after states. Box stays open until the before/after screens exist and are screenshotted.
- 2026-11-11 — P2-09: `js/shin.js` status engine. 23 unit tests: every row of the section 7 table, each yellow trigger alone, creeping up, boundaries, DECISIONS item 6 cases, red lock (4 days no, 5 without confirmation no, 5 plus confirmation yes, gap resets). The tests caught a real bug: a next-morning score dated after "today" was being counted. Choices made: a next-morning score of 5+ is red; "creeping up" means the during score strictly rose across the last three runs; cross-train sessions are not runs. Weak: consequences (conversion to cross-train, banner copy) are P2-10.
