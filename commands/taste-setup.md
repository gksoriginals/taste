---
name: taste-setup
description: Inspect this repository and create, resume, or refresh its product Taste Pack.
---

Run the explicit `taste-setup` Skill for the repository currently open. This authorizes inspection and writes inside `taste/`, not product UI changes.

- Inventory repository apps, routes, journeys, design sources, instructions, and the current Pack before choosing scope. Starter Pack surfaces are unconfirmed hints. Include all apps for a whole shared product request; ask only when multiple plausible scopes materially change what gets covered.
- Inspect source and docs even if rendered access is blocked. Use browser/harness UI tools for representative flows and meaningful states; source evidence can support useful partial guidance but never claim visual verification.
- Check safe public/demo/seed access. Never request production credentials or store secrets or real user data. If a journey is blocked, record its gap and continue with other accessible in-scope apps.
- Write the smallest useful, cited, product-specific guidance. Record confirmed scope, exclusions, evidence, per-surface coverage, status, and gaps. Preserve useful existing content and resume without overwriting finished work.
- Default `setupPolicy.minimumUsableEvidence` is `source_reviewed`; `rendered_flow` requires a rendered representative flow. Use `in_progress` until a surface meets the policy, `usable_partial` when at least one does, and `complete` only when every recorded required journey is rendered and source-correlated, the target is met, and validation passes. Legacy `incomplete` maps to `in_progress`.
- If there is no user-facing product UI or UI source, do not create a generic Pack. Keep ordinary UI requests separate from setup; a new surface can be designed in Expression first.
- Report inspected scope, sources/states, files changed, status, validation, gaps, and `/taste-setup` resume path if incomplete.
