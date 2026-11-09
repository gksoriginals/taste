---
name: taste-setup
description: Inspect this repository and create, resume, or refresh its product Taste Pack.
---

Run the explicit `taste-setup` Skill for the repository currently open. This authorizes inspection and writes inside `taste/`, not product UI changes.

- Inventory repository apps, routes, journeys, design sources, instructions, and the current Pack before choosing scope. Use inventory to find gaps, not as Pack content. Starter Pack surfaces are unconfirmed hints. For a whole shared product request, inventory all apps but choose representative consequential journeys; do not require guidance or coverage rows for every route. Ask only when multiple plausible scopes materially change what gets covered.
- Inspect source and docs even if rendered access is blocked. Use browser/harness UI tools for representative flows and meaningful states; source evidence can support useful partial guidance but never claim visual verification.
- Find how to run each app before rendering anything. Look in README run sections, repository instructions, package scripts, compose files, launch configs, seed scripts, example env test accounts, and the harness's own memory or notes for this repository.
- Find product decisions as well as operational recipes. Check relevant feedback memories, design/review notes, PR or issue comments, and instructions available to this host; report checked and inaccessible sources. Distill candidates with rationale, scope, exceptions, rejected alternatives, and provenance. Batch-confirm material candidates with the user. If a decision exists only in local-only memory the future agent cannot access, preserve its concise generalized lesson in the shared Pack. Never copy private quotes, raw transcripts, secrets, or personal data.
- Start stopped local dependencies (container runtime, database, backend, dev server) with that recipe, and sign in with documented local test accounts or seeds. Those are expected and are not production credentials. Check safe public/demo/seed access. Never request production credentials or store secrets or real user data.
- A UI that renders only loading or failure states because its backend is down has not been inspected with data. Record `statesObserved` for each rendered entry.
- Only after those attempts fail: if a journey is blocked, record its gap and the `accessAttempts`, ask once for safe access when it materially improves coverage, and continue with other accessible in-scope apps.
- For required journeys marked `not_inspected`, record access attempts too unless you explain why trying was unsafe or outside the confirmed scope. Do not skip an available, safe attempt.
- Save a Pack item only when future work is likely to need it and the future agent cannot cheaply recover it in its actual working context. Link to readily accessible product sources; preserve concise generalized decisions from inaccessible local-only sources, even when that duplicates local memory. Keep a short index linking to concise lessons; use judgment, not a fixed taxonomy or “failures only” rule. Put broad route inventory, sources checked, surfaces checked with no reusable lesson, and defects in the setup report; put startup/access recipes in dated harness notes. Record only representative Pack coverage needed to scope the retained guidance. Preserve evidence and distinguish owner decisions, observation, and inference.
- Default `setupPolicy.minimumUsableEvidence` is `source_reviewed`; `rendered_flow` requires a rendered representative flow. Use `in_progress` until a surface meets the policy, `usable_partial` when at least one does, and `complete` only when every user-confirmed required journey is rendered and source-correlated, has rendered every state in `setupScope.requiredStates` (default populated), the target is met, and validation passes. A host-selected sample cannot be complete. Legacy `incomplete` maps to `in_progress`; follow `taste_pack_inspect`'s `migrationNeeded`. Treat validation warnings as work items.
- If there is no user-facing product UI or UI source, do not create a generic Pack. Keep ordinary UI requests separate from setup; a new surface can be designed in Expression first.
- Report:
  - inspected scope;
  - how each app was started and signed in, or what was attempted;
  - sources and states;
  - whether any populated state was rendered;
  - files changed;
  - status and validation;
  - gaps, and the `/taste-setup` resume path if incomplete.
