---
name: taste-setup
description: Inspect this repository and create, resume, or refresh its product Taste Pack.
---

Run the explicit `taste-setup` Skill for the repository currently open. This authorizes inspection and writes inside `taste/`, not product UI changes.

- Inventory repository apps, routes, journeys, design sources, instructions, and the current Pack before choosing scope. Starter Pack surfaces are unconfirmed hints. Include all apps for a whole shared product request; ask only when multiple plausible scopes materially change what gets covered.
- Inspect source and docs even if rendered access is blocked. Use browser/harness UI tools for representative flows and meaningful states; source evidence can support useful partial guidance but never claim visual verification.
- Find how to run each app before rendering anything. Look in README run sections, repository instructions, package scripts, compose files, launch configs, seed scripts, example env test accounts, and the harness's own memory or notes for this repository.
- Start stopped local dependencies (container runtime, database, backend, dev server) with that recipe, and sign in with documented local test accounts or seeds. Those are expected and are not production credentials. Check safe public/demo/seed access. Never request production credentials or store secrets or real user data.
- A UI that renders only loading or failure states because its backend is down has not been inspected with data. Record `statesObserved` for each rendered entry.
- Only after those attempts fail: if a journey is blocked, record its gap and the `accessAttempts`, ask once for safe access when it materially improves coverage, and continue with other accessible in-scope apps.
- Write the smallest useful, cited, product-specific guidance. Record confirmed scope, exclusions, evidence, per-surface coverage, status, and gaps. Preserve useful existing content and resume without overwriting finished work.
- Default `setupPolicy.minimumUsableEvidence` is `source_reviewed`; `rendered_flow` requires a rendered representative flow. Use `in_progress` until a surface meets the policy, `usable_partial` when at least one does, and `complete` only when every recorded required journey is rendered and source-correlated, has rendered every state in `setupScope.requiredStates` (default populated), the target is met, and validation passes. Legacy `incomplete` maps to `in_progress`; follow `taste_pack_inspect`'s `migrationNeeded`. Treat validation warnings as work items.
- If there is no user-facing product UI or UI source, do not create a generic Pack. Keep ordinary UI requests separate from setup; a new surface can be designed in Expression first.
- Report:
  - inspected scope;
  - how each app was started and signed in, or what was attempted;
  - sources and states;
  - whether any populated state was rendered;
  - files changed;
  - status and validation;
  - gaps, and the `/taste-setup` resume path if incomplete.
