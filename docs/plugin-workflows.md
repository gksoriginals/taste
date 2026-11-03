# Taste workflow triggers

Taste provides reusable Skills and harness-specific explicit commands. Normal UI work never creates or refreshes a Pack. In Cursor, run `/taste-setup` to invoke the explicit repository setup command. In other supported hosts, invoke the `taste-setup` Skill from that host's skill picker. See [Cursor plugin commands](https://cursor.com/docs/reference/plugins#commands-format) and [Agent Plugins packaging](https://developers.openai.com/plugins/build/plugins).

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `taste-setup` / `/taste-setup` | User explicitly runs the command/Skill or asks to set up/update Taste | Inspect repo before choosing scope; ask only when the repo leaves a material scope ambiguity; run a bounded sweep; write, self-check, validate, and report a product-specific Pack. Resume incomplete setup without overwriting. |
| `taste-sweep` | Explicit setup/refresh invokes it | Inspect the agreed bounded product scope. It is never a side effect of a routine UI request. |
| `taste-design` | Any UI, UX, screen, or frontend task | Load an existing complete Pack. If absent, continue from repository evidence and offer explicit setup; do not create files or sweep. |
| `taste-conformance` | Follow existing product guidance or checklist | Apply only relevant Pack guidance. Existing complete Packs may receive reusable checklist learning during normal tasks. |
| `taste-expression` | New direction, gap, or correction | Explore and iterate in the host task. For an existing complete Pack, apply and self-check resolved reusable feedback, then update its scoped checklist without separate approval. With no Pack, keep it transient. |
| `taste-pack` | Explicit Pack inspection, validation, or maintenance | Inspect and validate. Broad Pack maintenance requires explicit user intent; `taste_pack_write` also supports resolved reusable checklist lessons in an existing complete Pack during normal UI work. |
| `taste-evaluate` | Explicit eval or calibration | Compare with/without-Skill generation and hand judging to the harness. |

## Setup and routine learning boundaries

Setup inspects the repository before choosing product/app scope. For a clear product with accessible UI, sweep representative rendered flows and states before creating its first Pack. State an obvious scope choice; ask only when multiple plausible products/apps materially change scope. If there is no product UI or first-time rendered inspection is inaccessible, do not initialize a Pack. A requested new product/surface can proceed in Expression and be set up after its UI exists. Use one Pack when apps share product identity and design foundations; separate Packs are reserved for genuinely independent products/repositories. Avoid broad monorepo sweeps.

A first Pack is initialized only after the bounded rendered sweep finds accessible product UI. Its manifest starts with `setupStatus: incomplete`; the host sets it to `complete` only after scoped evidence-backed content is written, self-checked, and validated. For refresh, inspect the existing Pack first, preserve useful guidance, and update only what new evidence supports. Mark it incomplete before the first refresh write. If interrupted after initialization or a refresh write, preserve completed files, keep it incomplete, and resume from existing content. Setup and review do not modify product UI.

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
