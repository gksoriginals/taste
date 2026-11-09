---
name: taste-sweep
description: During explicitly requested Taste setup or refresh, inspect an agreed product scope and create or update evidence-backed Pack guidance. Never run as a side effect of routine UI work.
---

# Sweep an agreed product scope during explicit setup

Follow `taste-setup` for the full lifecycle. Independently inventory repository apps/routes/journeys to find likely gaps, but do not turn that inventory into Pack content. Starter Pack surfaces are hints, not approved scope. If the user asks for the whole shared product/platform, inventory every app and choose representative, consequential journeys; do not require a guidance file or coverage row for every route. Record only the agreed review scope in the Pack. Keep “checked, no reusable lesson” notes and unselected findings in the setup report.

- Map routes into meaningful journeys and important states. Discover design references from repository evidence and integrations; Figma is optional. Do not require every route to be toured.
- Inspect representative rendered flows and states with available host UI tools. Review relevant source, docs, tokens, components, and state logic to corroborate observations and cover hard-to-reach cases. Label each evidence item `rendered`, `source_reviewed`, `design_reference`, or `inference`; source is never visual verification.
- Before rendering, start each in-scope app the documented way. Look in repository docs and instructions, scripts, compose files, launch configs, seed scripts, and the harness's own memory or notes for this repository. Sign in with documented local test accounts or seeds; they are expected, not production credentials.
- Check safe public/demo/seed access. Never request production credentials or save secrets or real user data.
- A UI rendering only loading or failure states because its backend is down is not populated coverage. List `statesObserved` for each rendered entry.
- Record `blocked` only after those attempts fail, with each attempt in `accessAttempts`. Ask once for safe access only when material, then continue with other accessible in-scope apps. Record blocked/not-inspected items and resume needs.
- For native or desktop apps, use the harness simulator, emulator, or app-preview tools.
- Keep only lessons whose likely future value justifies their context cost: decisions and tested lessons that cannot be cheaply recovered by rereading the product. Link to source and UI instead of copying them. Retain uncertainty and scope; do not infer intent from a single observation. Consolidate useful lessons into a short routing index and focused references. Keep defects in the audit report and startup/access recipes in dated operational notes. Do not add route descriptions, coverage rows, word quotas, or evaluation fixtures merely to make the Pack look complete. Do not apply a “failures only” rule; use judgment about salience and future usefulness. Preserve or remove existing content based on the same test.
- Track evidence for the representative journeys selected for this setup, not every route inspected during inventory. Pack readiness is `in_progress`, `usable_partial`, or `complete`. Default `source_reviewed` policy allows cited, actionable source guidance that clearly says visual behavior is unverified; `rendered_flow` requires a rendered representative journey. `usable_partial` applies only to listed supported guidance. `complete` requires the agreed representative coverage rendered and source-correlated, target met, self-review, and passing `taste_pack_validate`.
- If interrupted, preserve existing work and the most accurate status, and report `/taste-setup` as the resume path. Do not initialize a Pack if no product UI or UI source exists.

Normal UI task feedback remains in the active conversation unless it becomes a clear reusable lesson. Unresolved alternatives stay in the active task. Expression may save that lesson and its evidence to a relevant guidance file or create a minimal Pack for the affected surface; include rationale or rejected options when they help preserve the lesson. This does not trigger this multi-surface sweep.

Conformance and Expression are task approaches, not setup states or persistent Pack modes.
