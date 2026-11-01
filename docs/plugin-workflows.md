# Taste workflow triggers

Taste's commands are Skills in the Agent Plugins package. Harnesses expose them through their own skill picker. The descriptions in each `SKILL.md` frontmatter are what a skill router should match. [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), [Cursor plugin reference](https://cursor.com/docs/reference/plugins), [Claude Code Skills](https://code.claude.com/docs/en/skills).

| Workflow | When the harness should select it | What it does |
| --- | --- | --- |
| `taste-setup` | "Set up Taste", "initialize a Pack", "create taste/". | For an explicit setup request, create or continue one Pack. A missing Pack during a design task is not a setup request; defer creation until the user approves the tested artifact, then initialize and record without a second confirmation. |
| `taste-sweep` | "Sweep", "learn the existing UI", "extract taste from the product". | Inspect rendered UI and keep candidate judgments in the host task until the owner approves and host-reported validation is ready. |
| `taste-design` | Any UI, UX, screen, or frontend task. | Load an existing Pack. If absent, use transient Expression; create it after host checks pass and the user approves the tested artifact, then record its reusable Decision automatically. |
| `taste-conformance` | "Match the existing taste" or part state derives Conformance. | Apply only Decisions with complete host-reported validation and user approval, shipped evidence, and no gap. New direction or correction goes through Expression. |
| `taste-expression` | New taste, an interview, a from-scratch part, a gap, or a correction. Also when part state derives Expression. | Interview and iterate in the host task. A positive reaction to an early direction nudges the host to continue its own workflow. After checks pass and the user approves the final tested artifact, call `taste_record_signal` with a concise reusable Decision derived from the request and result; do not ask for separate Pack confirmation. |
| `taste-pack` | Edit or review Pack files. | Inspect and validate Pack files. Decision files can only be changed through the finalized `taste_record_signal` path. |
| `taste-evaluate` | Explicit eval or calibration. | Paired with/without-Skill runs and a separate Judge packet. |

## Optional craft capabilities during Expression

Expression can identify a need for specialist craft beyond the Pack, including visual composition, interaction design, UX flows, or product-decision elicitation. Follow this host-portable sequence:

1. **Detect:** inspect capabilities already available in the host and use a suitable installed skill or plugin through its normal workflow. Taste does not rank candidates or require a named capability.
2. **Ask:** if none fits, tell the user what capability is missing and ask permission before internet research or installation. After research, show the candidates and get approval for the selected installation. A declined request means continue with available capabilities.
3. **Try:** use the approved capability on the current task and assess its value through the host's normal artifact review. Keep results in the host task; never write them as Pack Decisions.
4. **Lock:** ask whether the user wants to keep it. With approval, record the skill/plugin identity, version/source, and intended scope in a host-supported product or harness workflow location. The host owns future activation. If no persistent location fits, report that the lock is session-only.

The host owns discovery, installation, trials, and locks. Taste has no curated catalog, shortlist, ranking, required skill names, or automatic install behavior. A lock is a host workflow choice, not durable product taste. Defer formal benchmarks until a product has approved locks and measurable evidence.

## How a part is chosen

Call `taste_part_state` after loading the Pack and always pass `taskIntent` plus the affected scope. Use `apply_existing` when following established guidance; use `new_direction`, `correction`, `gap`, `greenfield`, or `unclear` for the corresponding request; use `inspect_only` for setup or Pack maintenance. The tool returns a task-local Expression route for the Expression intents even if the durable Pack scope is Conformance; it reports persisted Pack state separately and does not change it. The host must interpret the request and supply this structured signal because the tool cannot read conversation text. With `apply_existing`, Conformance means every Decision in that scope is accepted, includes matching host-reported validation and user-approval evidence, has shipped evidence, and has no coverage gap. Any other Decision, or no Decision, derives Expression.

Pass task intent into `taste_part_state` for new taste, a correction, a gap, greenfield work, or an unclear request. The returned task-local Expression route overrides Conformance only for the current task and requested scope; it does not rewrite unrelated Decisions or persisted Pack state. Keep early feedback, rejected drafts, and unresolved gaps in the host's active task context; do not write proposed Decisions to the Pack.

The optional `decisionPromotionCheckpoint` in `taste/manifest.json` is plain-language reminder text for when the host should invoke Taste. It does not define product checks or approval steps, observe test results, or trigger a push. The host owns those workflows. For a greenfield task, the Pack remains absent until the host reports checks passed and the user approves the tested artifact; that approval authorizes recording a concise reusable Decision without another confirmation. The agent's own review does not count as user approval. `taste_record_signal` stores the host's report; Taste does not verify those claims.

`taste_mode_resolve` is deprecated. It does not read the Pack or decide who starts a change. Keep only Expression and Conformance; derive activity per part.

An empty new Pack is Expression. Do not invent Decisions to make setup look finished. Do not require both a conformance folder and an expression folder.
