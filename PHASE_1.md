# Phase 1 — Setup, decisions, first deploy (interactive, not a loop)

You are starting a personal training website for Nate Miller. Two files in this folder define it:

- `PLAN.md` — his training plan. The only source of training content. Never change its content.
- `SITE_SPEC.md` — what the site is, who it's for, the constraints, the screens, and the logic.

Read both fully before doing anything.

This phase ends with an empty-but-real site live on GitHub Pages, the open decisions settled with Nate, and a build checklist ready for the next two phases, which will run unattended in a loop. Questions are cheap now and expensive later, so this is where you ask them.

## Do this, in order

1. **Look at his existing site for reference.** Use the GitHub plugin or `gh` to read the repo `nathanmiller48/bjj-tracker` and open `https://nathanmiller48.github.io/bjj-tracker/` with Playwright at 390 × 844. Note how it's built and deployed, what works on a phone, and what doesn't. It is a reference for the deployment approach and for what he's used to, not a design to copy. The new site should be clearly better.

2. **Ask Nate the decisions in `SITE_SPEC.md` section 8** using AskUserQuestion, plus anything you found in step 1 that is truly his call. Batch them; don't drip them one at a time. Write every answer to `DECISIONS.md` with the date.

3. **Scaffold the project** to match the constraints in `SITE_SPEC.md` section 2: static, no build step to deploy, relative paths, ES modules. Set up the dev-only test tooling (a unit test runner and Playwright) so that `npm test` runs everything and none of it is needed by GitHub Pages.

4. **Create the repo and deploy.** Create the public repo under `nathanmiller48` with the name he chose, push, enable GitHub Pages, and wait for it to go live. Open the live URL with Playwright and confirm it loads at 390 × 844. If authentication or permissions block you, stop and tell Nate exactly what to do.

5. **Write `PROGRESS.md`**: a checklist of everything Phases 2 and 3 must build, taken from `SITE_SPEC.md`, as unchecked boxes grouped under "Phase 2" and "Phase 3" using the scopes below. Each item must be small enough to finish and verify in one sitting and must say how it will be verified. Add a "Log" section at the bottom for dated one-line entries.

   - **Phase 2 scope (the working core):** plan data generated from `PLAN.md` with tests; Today screen; logging for all session types; the shin status engine with tests; Week screen; Library; Safety screen; localStorage with export and import; date override; deploy.
   - **Phase 3 scope (motivation and polish):** Progress screen with the route, milestones, charts, benchmarks and gates; Track B generation with tests; weather and fallback verdict; installable and offline; verse of the day; themes; visual polish pass on every screen; accessibility pass; final deploy.

6. **Write `CLAUDE.md`** for this repo with what a future session needs: how to run tests, how to deploy, the rule that `PLAN.md` content is never changed without asking Nate, the rule that answered decisions live in `DECISIONS.md` and are not re-asked, and the rule that claims of "done" require a passing test or a screenshot you actually looked at.

7. **Report to Nate:** the live URL, what you decided and why, and anything you're unsure about.

## Standards

- If something in `PLAN.md` and `SITE_SPEC.md` seems contradictory or impossible, ask Nate. Don't guess and don't quietly pick one.
- Don't build features in this phase. A header and "Coming soon" on the live URL is the right amount.
- Commit in small steps with clear messages.
