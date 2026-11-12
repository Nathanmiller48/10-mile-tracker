# 10-mile-tracker

Nate Miller's personal training tracker. Static site on GitHub Pages, opened on a phone before 6:30am. He acts on what it says, and he has a shin problem, so correct plan data and correct shin advice matter more than anything visual.

## Read first, every session

1. `PROGRESS.md` — the checklist, any "Blocked — needs Nate" items, open questions, and the last few Log entries.
2. `DECISIONS.md` — what Nate has already decided. It overrides `SITE_SPEC.md` where they differ.
3. `SITE_SPEC.md` — what the site does. `PLAN.md` — the training content.

## Rules

- **`PLAN.md` content is never changed without asking Nate.** It is the only source of training content. Site data is generated from it, not retyped. If `PLAN.md` and `SITE_SPEC.md` conflict or something looks impossible, ask him; don't pick one quietly.
- **Answered decisions live in `DECISIONS.md` and are not re-asked.** When Nate answers a new question, write it there with the date. Ask him only about taste, his data, his schedule, or plan content; never about implementation choices.
- **"Done" requires proof.** A box in `PROGRESS.md` is ticked only after a passing test or a 390 × 844 screenshot that was actually opened and looked at. Then add a dated one-line Log entry: what changed, how it was verified, what is still weak.
- **His saved log must survive every deploy.** One versioned `localStorage` key (`ten-mile-tracker`). New fields must be optional; if the shape truly changes, bump `VERSION` in `js/storage.js`, write a migration, and test it against `tests/fixtures/phase2-state.json`.
- **Scripture is never typed from memory.** Verse text is Berean Standard Bible, copied by `scripts/build-verses.mjs` from `tests/fixtures/bsb.txt` and checked against it by a test. To change the verses, edit only the list of references in that script. No ESV or other copyrighted text in the repo.
- Shin status colors (green, yellow, red) are used only for shin status and always with a word. A test enforces this.

## Constraints (from `SITE_SPEC.md` section 2)

- Plain HTML, CSS, and JavaScript ES modules. No frameworks, no build step to deploy, no web fonts, no CDN scripts.
- **All paths relative.** The site is served under `/10-mile-tracker/`. Unit tests fail on root-absolute or external paths in `index.html` and the manifest.
- Generated files are committed, because Pages runs no build: `js/data/plan.js`, `js/data/content.js`, `js/data/verses.js`, `sw.js`. Never edit them by hand.
- `node_modules`, tests and scripts are dev-only. Nothing the site loads may depend on them.

## Layout

- `index.html`, `css/styles.css`, `js/` — the site.
  - Pure logic, no DOM, importable by `node --test`: `dates.js`, `storage.js`, `shin.js` (status engine), `day.js` (what a day asks of him), `plan.js` (active plan: Track A or B), `trackb.js` (section 8 generator), `gates.js`, `milestones.js`, `weather.js` (verdict + fetch), `verse.js`, `route.js`.
  - Rendering: `views.js` (Today, Week, Library, More…), `progress.js` (Progress and charts), `sheet.js` (logging sheet), `html.js`, `app.js` (state, routing, events, service worker registration).
- `scripts/` — generators and dev tools: `build-plan.mjs`, `build-content.mjs`, `build-verses.mjs`, `build-sw.mjs`, `make-icons.mjs`, `contact-sheet.mjs`, `serve.mjs` (dev server under `/10-mile-tracker/`, with a `/__test/deploy` hook used by the update test).
- `tests/unit/` — Node's built-in test runner. `tests/e2e/` — Playwright, phone viewport 390 × 844. `tests/e2e/helpers.js` exports the `test` object every spec must use (it blocks real forecast requests), `seed`, `sampleLog`, `shot`.

## Commands

```bash
npm install                   # once; then: npx playwright install chromium
npm test                      # regenerates sw.js, then unit tests, then Playwright on the dev server
npm run test:unit             # logic only, fast
npm run test:e2e              # Playwright only (starts scripts/serve.mjs itself)
npm run serve                 # http://localhost:4173/10-mile-tracker/
npm run test:live             # the same Playwright tests against the live site
npm run build:data            # regenerate plan, content, verses and sw.js after PLAN.md changes
npm run build:sw              # regenerate sw.js only (any change to a served file changes its version)
node scripts/contact-sheet.mjs dark   # one image of every "dark-*" screenshot in test-results/
```

Screenshots: in a Playwright test use `shot(page, testInfo, 'name')`; they land in `test-results/`. Use `?date=YYYY-MM-DD` to render any day, or `page.clock.setFixedTime(...)` when the real "today" matters (weather). Open the image and look at it before claiming a screen works.

## Deploy

GitHub Pages serves the `main` branch root of `nathanmiller48/10-mile-tracker` (`.nojekyll` is present, so files are served as-is). Deploying is:

```bash
npm test
git add -A
git commit -m "…"
git push origin main
```

`npm test` must come first: it regenerates `sw.js`, and a stale `sw.js` means phones keep the old version. Then wait a minute or two, run `npm run test:live`, and look at the live page at `https://nathanmiller48.github.io/10-mile-tracker/`. The GitHub CLI (`gh`) is not installed on this machine; git pushes go through Git Credential Manager.

Commit in small steps with clear messages.
