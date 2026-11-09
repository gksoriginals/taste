---
name: taste-pack
description: Maintain a product Taste Pack. Use when inspecting, validating, or editing product guidance and checking Pack structure. For setup use the explicitly invoked `taste-setup` / `/taste-setup` workflow. For a visual sweep of shipped UI use taste-sweep. For interviews, new requirements, gaps, and corrections use taste-expression.
---

# Maintain one Pack

The harness coding agent interprets evidence. Taste tools read and write files inside the product repository's `taste/` directory.

## Where finalized judgment lives

Store durable product judgment in scoped references: decisions and reasons, tested lessons, and traps discovered through use that a future assistant is unlikely to recover by rereading code or reopening the screen. Link to code, lint, docs, existing instructions, or rendered behavior instead of copying what they already show. Preserve evidence and distinguish observation, inference, and settled intent; note context for facts that may change. Choose a form that teaches the judgment, such as a checklist, decision tree, or annotated example. Do not invent examples. Keep the product-design entry Skill focused on routing by task and surface. Link new references from that routing and list them in matching manifest coverage. During normal UI work, the host may update scoped guidance or add coverage for an uncovered surface while preserving existing setup scope, status, policy, and other coverage. The host may initialize a minimal Pack only when none exists and the host has applied a clear reusable lesson and kept the edit only if existing checks show improvement or no regression. No separate approval is needed. A broad product sweep still requires explicit user invocation of `/taste-setup`. During refresh, preserve the most accurate status as evidence changes; use `in_progress`, `usable_partial`, or `complete` according to validated evidence and confirmed scope. Conformance and Expression are task approaches, not Pack states.


## Update rules

- `taste_pack_initialize` creates an `in_progress`, non-overwriting shell and fails if `taste/` already exists. Use it during explicit `/taste-setup` after inventory, or during a normal UI task only after resolved user feedback yields a clear reusable lesson for a specific surface. For a feedback-created Pack, immediately replace starter text with scoped guidance and provenance, record only that surface as `usable_partial`, and validate; do not start a broader sweep. Do not initialize when no product UI or UI source exists. Source-only inspection can support `usable_partial` under the default `source_reviewed` policy when guidance is cited and visual behavior is explicitly unverified; `rendered_flow` requires a rendered representative journey. For broader refreshes, inspect the existing Pack first and preserve useful content. The shell is not a completed Pack and does not edit harness instructions.
- Inspect and validate before and after Pack maintenance. Follow `migrationNeeded` from `taste_pack_inspect` for older Packs (a legacy `incomplete` status means `in_progress`). Treat validation warnings as work items. `taste_pack_write` can edit checklists, facts, Skills, references, metadata, and fixtures inside `taste/`.
- Coverage fields that validation enforces:
  - a `source_reviewed` evidence reference is a repository-relative file path (optionally `:line`) that exists;
  - a `rendered` entry lists `statesObserved` from populated, empty, loading, error, denied, validation, offline;
  - a `blocked` entry lists the `accessAttempts` made before giving up;
  - `complete` requires every required entry to have rendered each state in `setupScope.requiredStates` (default populated).
- A reference that records facts or evidence rather than a design decision declares `taste-kind: facts` (or `evidence`) in its frontmatter, so it is not asked for Why/Rejected sections.
- Unresolved alternatives stay in the active task, along with one-off reactions and private conversation details. When writing guidance, record settled rejected alternatives (what was considered and why it lost) with the trigger, scope, why, exceptions, and evidence. Do not invent examples; cite product evidence. When user feedback yields a reusable correction, update the relevant guidance or add a minimal `usable_partial` surface scope after applying it and keeping the edit only if existing checks show improvement or no regression; initialize a shell only when no Pack exists. Cite the changed artifact or product source; do not store private user quotes or personal details.
- No separate review or promotion is required to update guidance. The user can keep collaborating and correct a guidance entry in the same ongoing task.
- Preserve uncertainty. One screenshot is not a universal rule.
- Route ordinary work from the user's task and affected product surface. Choose Conformance to apply established sourced guidance, Expression to explore a new direction or address a gap/correction, or clarify when intent or scope is materially unclear.

For evaluation fixtures, use `taste-evaluate`. Fixture lanes named conformance and expression are storage paths, not Pack modes.
