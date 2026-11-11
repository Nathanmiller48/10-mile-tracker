# Decisions

Answered by Nate. Do not re-ask these. Where an answer differs from `SITE_SPEC.md`, the answer here wins.

## 2026-11-11 — Phase 1

1. **Repo name:** `10-mile-tracker`. Live at `https://nathanmiller48.github.io/10-mile-tracker/`.

2. **Accent color:** Sunrise coral, about `#FF8A6B` on the dark theme. Warm pink-orange. It must stay clearly distinct from the shin-status yellow and red. (A darker coral is needed for text on the light theme to hold 4.5:1; that is an implementation detail.)

3. **Weather location:** Nate said "I'm at MSU in East Lansing every day now." So **East Lansing is the default every day**, not only Wednesdays. There is no weekly Almont / Shelby Township alternation and no Sunday prompt. Almont and Shelby Township stay selectable in Settings for trips home. This replaces the "East Lansing auto-selected on Wednesdays" rule in `SITE_SPEC.md` section 4.

4. **Verse of the day:** **On by default.** Nate reads ESV and does not like KJV. ESV is copyrighted, so its text cannot be bundled in a public repo. He chose the **Berean Standard Bible (BSB)**, which is public domain, as the bundled text. This replaces "KJV only" in `SITE_SPEC.md` sections 4 and 5. Everything else in that rule stands: at least 60 verses, copied from a public-domain BSB source file and checked against it by a test, never typed from memory, chosen deterministically by date. The reference may link to the same verse in ESV on esv.org (a link only, no ESV text in the repo).

5. **From the bjj-tracker site, carry over:**
   - **Tap-to-expand exercises:** exercise rows expand to show notes and cues.
   - **A History list:** a plain chronological list of past logged sessions, in addition to the Progress charts.
   Nothing else from that site is carried over.

## Notes for later phases (not decisions, just facts found in Phase 1)

- `PLAN.md` still says "Tue evening: Off (drive to MSU)". That is plan content and is left as written. Nate has not asked for a change.
- bjj-tracker reference: one HTML file with React and in-browser Babel from a CDN, deployed from `main` root with Jekyll, app at an awkward file URL, no awareness of today's date, all tap targets under 44 px, pinch-zoom disabled, no offline support. The new site avoids all of these by following `SITE_SPEC.md`.
