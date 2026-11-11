# 10-mile-tracker

Nate Miller's personal training tracker. Static site on GitHub Pages, opened on a phone before 6:30am. He acts on what it says, and he has a shin problem, so correct plan data and correct shin advice matter more than anything visual.

## Read first, every session

1. `PROGRESS.md` — the checklist, any "Blocked — needs Nate" items, and the last few Log entries.
2. `DECISIONS.md` — what Nate has already decided. It overrides `SITE_SPEC.md` where they differ.
3. `SITE_SPEC.md` — what the site does. `PLAN.md` — the training content.

## Rules

- **`PLAN.md` content is never changed without asking Nate.** It is the only source of training content. Site data is generated from it, not retyped. If `PLAN.md` and `SITE_SPEC.md` conflict or something looks impossible, ask him; don't pick one quietly.
- **Answered decisions live in `DECISIONS.md` and are not re-asked.** When Nate answers a new question, write it there with the date. Ask him only about taste, his data, his schedule, or plan content; never about implementation choices.
- **"Done" requires proof.** A box in `PROGRESS.md` is ticked only after a passing test or a 390 × 844 screenshot that was actually opened and looked at. Then add a dated one-line Log entry: what changed, how it was verified, what is still weak.
- **His saved log must survive every deploy.** One versioned `localStorage` key. If the shape changes, write a migration and test it against data saved by the previous version.
- **Scripture is never typed from memory.** Verse text is Berean Standard Bible, copied from a public-domain source file and checked against it by a test. No ESV or other copyrighted text in the repo.
- Shin status colors (green, yellow, red) are used only for shin status and always with a word.

## Constraints (from `SITE_SPEC.md` section 2)

- Plain HTML, CSS, and JavaScript ES modules. No frameworks, no build step to deploy, no web fonts, no CDN scripts.
- **All paths relative.** The site is served under `/10-mile-tracker/`. A unit test fails on root-absolute or external paths in `index.html`.
- Generated files (for example `js/data/plan.js` from `PLAN.md`) are committed, because Pages runs no build.
- `node_modules`, tests and scripts are dev-only. Nothing the site loads may depend on them.

## Layout

- `index.html`, `css/`, `js/` — the site. `js/` modules that hold logic stay pure (no DOM) so `node --test` can import them.
- `tests/unit/` — Node's built-in test runner. `tests/e2e/` — Playwright, phone viewport 390 × 844, dark scheme by default.
- `scripts/serve.mjs` — dev server that serves the repo under `/10-mile-tracker/`, like Pages.

## Commands

```bash
npm install                   # once; then: npx playwright install chromium
npm test                      # unit tests, then Playwright against the local dev server
npm run test:unit             # logic only, fast
npm run test:e2e              # Playwright only (starts scripts/serve.mjs itself)
npm run serve                 # http://localhost:4173/10-mile-tracker/
npm run test:live             # the same Playwright tests against the live site
```

Screenshots: in a Playwright test use `page.screenshot({ path: testInfo.outputPath('name.png') })`; they land in `test-results/`. Use `?date=YYYY-MM-DD` to render any day. Open the image and look at it before claiming a screen works.

## Deploy

GitHub Pages serves the `main` branch root of `nathanmiller48/10-mile-tracker` (`.nojekyll` is present, so files are served as-is). Deploying is:

```bash
npm test
git push origin main
```

Then wait a minute or two, run `npm run test:live`, and look at the live page at `https://nathanmiller48.github.io/10-mile-tracker/`. The GitHub CLI (`gh`) is not installed on this machine; git pushes go through Git Credential Manager.

Commit in small steps with clear messages.
