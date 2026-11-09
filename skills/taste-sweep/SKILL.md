---
name: taste-sweep
description: During explicitly requested Taste setup or refresh, inspect an agreed product scope and create or update evidence-backed Pack guidance. Never run as a side effect of routine UI work.
---

# Sweep an agreed product scope during explicit setup

Follow `taste-setup` for the full lifecycle. Independently inventory repository apps/routes/journeys before selecting scope; starter Pack surfaces are hints, not approved scope. Include every app when the user asks for the whole shared product/platform. Ask a scope question only when repository evidence leaves multiple material choices. Record the confirmed scope, exclusions, required coverage, and target.

- Map routes into meaningful journeys and important states. Discover design references from repository evidence and integrations; Figma is optional. Do not require every route to be toured.
- Inspect representative rendered flows and states with available host UI tools. Review relevant source, docs, tokens, components, and state logic to corroborate observations and cover hard-to-reach cases. Label each evidence item `rendered`, `source_reviewed`, `design_reference`, or `inference`; source is never visual verification.
- Before rendering, start each in-scope app the documented way. Look in repository docs and instructions, scripts, compose files, launch configs, seed scripts, and the harness's own memory or notes for this repository. Sign in with documented local test accounts or seeds; they are expected, not production credentials.
- Check safe public/demo/seed access. Never request production credentials or save secrets or real user data.
- A UI rendering only loading or failure states because its backend is down is not populated coverage. List `statesObserved` for each rendered entry.
- Record `blocked` only after those attempts fail, with each attempt in `accessAttempts`. Ask once for safe access only when material, then continue with other accessible in-scope apps. Record blocked/not-inspected items and resume needs.
- For native or desktop apps, use the harness simulator, emulator, or app-preview tools.
- Create only focused, cited product guidance supported by evidence. Record the trigger, scope, why, exceptions, and evidence. Unresolved alternatives stay in the active task. Settled rejected alternatives — options that were considered and why they lost — must be recorded in the guidance. Do not invent examples; cite product evidence (a rendered observation, source, design reference, or an explicit settled decision). Preserve useful existing Pack content; selectively fix stale, conflicting, missing, or unsupported guidance. The host self-reviews coverage, traceability, accuracy, consistency, and usefulness. Do not create fixed catalogs, generic boilerplate, empty files, or product UI changes.
- Track per-app/surface/journey status independently: `source_reviewed`, `rendered`, `blocked`, or `not_inspected`, with evidence and gaps. Pack readiness is `in_progress`, `usable_partial`, or `complete`. Default `source_reviewed` policy allows cited, actionable source guidance that clearly says visual behavior is unverified; `rendered_flow` requires a rendered representative journey. `usable_partial` applies only to listed supported coverage. `complete` requires all recorded required coverage rendered and source-correlated, target met, self-review, and passing `taste_pack_validate`.
- If interrupted, preserve existing work and the most accurate status, and report `/taste-setup` as the resume path. Do not initialize a Pack if no product UI or UI source exists.

Normal UI task feedback remains in the active conversation unless it becomes a clear reusable lesson. Unresolved alternatives stay in the active task. Expression may save that lesson, including settled rejected alternatives and cited product evidence, to a relevant guidance file or create a minimal Pack for the affected surface; this does not trigger this multi-surface sweep.

Conformance and Expression are task approaches, not setup states or persistent Pack modes.
