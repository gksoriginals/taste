# Taste workflow triggers

Taste provides reusable Skills and harness-specific explicit commands. Normal UI work never creates or refreshes a Pack. In Cursor, run `/taste-setup` to invoke the explicit repository setup command. In other supported hosts, invoke the `taste-setup` Skill from that host's skill picker. See [Cursor plugin commands](https://cursor.com/docs/reference/plugins#commands-format) and [Agent Plugins packaging](https://developers.openai.com/plugins/build/plugins).

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `taste-setup` / `/taste-setup` | User explicitly runs the command/Skill or asks to set up/update Taste | Independently inventory repository apps/routes before choosing scope; starter surfaces are hints. Ask only when a material scope ambiguity remains, continue other apps when one is blocked, and write, self-check, validate, and report an evidence-backed Pack. Resume safely without overwriting. |
| `taste-sweep` | Explicit setup/refresh invokes it | Inspect the agreed bounded product scope. It is never a side effect of a routine UI request. |
| `taste-design` | Any UI, UX, screen, or frontend task | Load an existing complete Pack. If absent, continue from repository evidence and offer explicit setup; do not create files or sweep. |
| `taste-conformance` | Follow existing product guidance or checklist | Apply only relevant Pack guidance. Existing complete Packs may receive reusable checklist learning during normal tasks. |
| `taste-expression` | New direction, gap, or correction | Explore and iterate in the host task. For an existing complete Pack, apply and self-check resolved reusable feedback, then update its scoped checklist without separate approval. With no Pack, keep it transient. |
| `taste-pack` | Explicit Pack inspection, validation, or maintenance | Inspect and validate. Broad Pack maintenance requires explicit user intent; `taste_pack_write` also supports resolved reusable checklist lessons in an existing complete Pack during normal UI work. |
| `taste-evaluate` | Explicit eval or calibration | Compare with/without-Skill generation and hand judging to the harness. |

## Setup and routine learning boundaries

Setup independently inventories apps, routes, and navigation (starter Pack surfaces are hints), then chooses a bounded scope. Figma is optional. Group journeys and states and sample representative routes. Ask only when multiple plausible products/apps materially change scope; include all apps when the user requests the whole shared product. If no product UI or source exists, do not initialize. Source-only inspection can produce actionable cited guidance and `usable_partial` under the default `source_reviewed` policy, clearly marked as not visually verified. Continue on accessible apps when one journey is blocked; record gaps. `rendered_flow` requires a rendered representative journey. Use one Pack for a shared product; separate Packs only for independent products/repositories.

A first Pack starts at `in_progress` after repository evidence confirms user-facing UI or UI source. The default `source_reviewed` policy allows `usable_partial` once a surface has specific cited guidance and unverified visual behavior is labeled; `rendered_flow` requires a rendered representative journey. `complete` requires every confirmed required coverage item rendered and source-correlated, its target met, self-review, and passing validation. Refresh reviews and preserves useful guidance, records gaps, and retains the most accurate status. Label evidence as rendered observation, source fact, design reference, or inference. Setup and review do not modify product UI.

Inspect public/demo routes and safe local seed/test workflows before requesting auth help. If auth blocks important coverage, ask once for access or a safe local path. Never request production credentials or store credentials, tokens, or real user data. The Pack remains canonical product knowledge. A configured host memory may store only operational notes such as startup/seed steps or route entry points, with provenance and a last-verified date; verify them before reuse.

Normal UI requests use a completed Pack without invoking setup. When user feedback resolves into a reusable lesson, the host can update the relevant checklist of that existing Pack after applying and self-checking the result. One-off or unresolved feedback stays in the conversation. When there is no Pack, the host keeps learning task-local and offers explicit setup separately.

## Optional craft capabilities during Expression

Expression can identify a need for specialist craft beyond the Pack, including visual composition, interaction design, UX flows, or product-decision elicitation. Follow this host-portable sequence:

1. **Detect:** inspect capabilities already available in the host and use a suitable installed skill or plugin through its normal workflow. Taste does not rank candidates or require a named capability.
2. **Ask:** if none fits, tell the user what capability is missing and ask permission before internet research or installation. After research, show the candidates and get approval for the selected installation. A declined request means continue with available capabilities.
3. **Try:** use the approved capability on the current task and assess its value through the host's normal artifact review. Keep results in the host task; never write them as Pack Decisions.
4. **Lock:** ask whether the user wants to keep it. With approval, record the skill/plugin identity, version/source, and intended scope in a host-supported product or harness workflow location. The host owns future activation. If no persistent location fits, report that the lock is session-only.

The host owns discovery, installation, trials, and locks. Taste has no curated catalog, shortlist, ranking, required skill names, or automatic install behavior. A lock is a host workflow choice, not durable product taste. Defer formal benchmarks until a product has approved locks and measurable evidence.

## How a part is chosen

For normal UI tasks, route from the user's request and affected surface. Load the relevant product guidance, then apply established guidance (Conformance), explore a new direction/gap/correction (Expression), or ask a focused clarification when intent or scope remains materially unclear. Existing guidance may still apply during Expression work.

Keep unresolved alternatives and one-off feedback in the host's active task; after applying clear reusable user feedback, self-check and update the scoped checklist with `taste_pack_write` in the same task. Do not create proposed structured Decision files.

The optional `decisionPromotionCheckpoint` in `taste/manifest.json` is legacy reminder text. Routine reusable checklist learning is allowed only when a complete Pack already exists; it does not trigger setup. With no Pack, keep feedback task-local until explicit setup. `taste_record_signal` remains for legacy structured Decision records; Taste does not run product checks or observe conversation history.

`taste_part_state` and `taste_mode_resolve` remain available for legacy structured Decision compatibility or diagnostics. They do not route normal checklist-based work. Conformance and Expression are host-selected approaches for the current task, not persisted states.

An empty new Pack is Expression. Do not invent Decisions to make setup look finished. Do not require both a conformance folder and an expression folder.
