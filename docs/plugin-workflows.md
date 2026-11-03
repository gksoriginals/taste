# Taste workflow triggers

Taste's commands are Skills in the Agent Plugins package. Harnesses expose them through their own skill picker. The descriptions in each `SKILL.md` frontmatter are what a skill router should match. [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), [Cursor plugin reference](https://cursor.com/docs/reference/plugins), [Claude Code Skills](https://code.claude.com/docs/en/skills).

| Workflow | When the harness should select it | What it does |
| --- | --- | --- |
| `taste-setup` | "Set up Taste", "initialize a Pack", "create taste/". | Inventory and sweep the whole product UI, optionally in parallel by bounded surfaces. The host creates and self-reviews a tailored task-and-surface router, focused references, checklists, and product metadata, then writes the Pack. No separate human review or approval stage. |
| `taste-sweep` | "Sweep", "learn the existing UI", "extract taste from the product"; also the missing-Pack path when the requested UI already exists. | Inventory the product's user-facing surfaces and inspect rendered flows/states. The host self-checks coverage and evidence, then populates the Pack with sourced guidance and reusable checklists. |
| `taste-design` | Any UI, UX, screen, or frontend task. | Load an existing Pack. If absent, route existing UI through a whole-product bootstrap Sweep and greenfield UI through transient Expression. Resolved user feedback updates reusable checklists without a separate approval checkpoint. |
| `taste-conformance` | "Match the existing product guidance" or follow a scoped checklist. | Apply task-and-surface references and checklist guidance. Legacy structured Decisions may also be read. New directions and corrections use Expression and update reusable checklists after host self-check. |
| `taste-expression` | New taste, an interview, a from-scratch part, a gap, or a correction. Also when part state derives Expression. | Interview and iterate in the host task. Resolve the user's correction or disagreement, self-check the change, and automatically update a reusable scoped checklist with `taste_pack_write`; no separate human review or promotion approval. |
| `taste-pack` | Edit or inspect Pack files. | Inspect and validate Pack files. Routine checklists and references use `taste_pack_write`; `taste_record_signal` is reserved for legacy structured Decision records. |
| `taste-evaluate` | Explicit eval or calibration. | Paired with/without-Skill runs and a separate Judge packet. |

## Optional craft capabilities during Expression

Expression can identify a need for specialist craft beyond the Pack, including visual composition, interaction design, UX flows, or product-decision elicitation. Follow this host-portable sequence:

1. **Detect:** inspect capabilities already available in the host and use a suitable installed skill or plugin through its normal workflow. Taste does not rank candidates or require a named capability.
2. **Ask:** if none fits, tell the user what capability is missing and ask permission before internet research or installation. After research, show the candidates and get approval for the selected installation. A declined request means continue with available capabilities.
3. **Try:** use the approved capability on the current task and assess its value through the host's normal artifact review. Keep results in the host task; never write them as Pack Decisions.
4. **Lock:** ask whether the user wants to keep it. With approval, record the skill/plugin identity, version/source, and intended scope in a host-supported product or harness workflow location. The host owns future activation. If no persistent location fits, report that the lock is session-only.

The host owns discovery, installation, trials, and locks. Taste has no curated catalog, shortlist, ranking, required skill names, or automatic install behavior. A lock is a host workflow choice, not durable product taste. Defer formal benchmarks until a product has approved locks and measurable evidence.

## How a part is chosen

Call `taste_part_state` after loading the Pack and always pass `taskIntent` plus the affected scope. Use `apply_existing` when following established guidance; use `new_direction`, `correction`, `gap`, `greenfield`, or `unclear` for the corresponding request; use `inspect_only` for setup or Pack maintenance. The tool returns a task-local Expression route for the Expression intents and reports legacy structured Decision state separately. The host interprets the request and supplies this structured signal because the tool cannot read conversation text. Load applicable checklist files independently of derived Decision state, including when the scope derives Expression due to having no structured Decision.

Pass task intent into `taste_part_state` for new taste, a correction, a gap, greenfield work, or an unclear request. The returned task-local Expression route applies to the current task and requested scope. Keep unresolved alternatives and one-off feedback in the host's active task; after applying clear reusable user feedback, self-check and update the scoped checklist with `taste_pack_write` in the same task. Do not create proposed structured Decision files.

The optional `decisionPromotionCheckpoint` in `taste/manifest.json` is legacy reminder text; it is not required for routine learning. For greenfield UI or existing UX, the host can populate the Pack after its own source and coverage checks. During ongoing work, user corrections, rejections, and disagreements are direct signals: apply them, self-check the result, and write clear reusable checklist items with `taste_pack_write`. No separate Decision review or promotion step is required. `taste_record_signal` remains for legacy structured Decision records; Taste does not run product checks or observe conversation history.

`taste_mode_resolve` is deprecated. It does not read the Pack or decide who starts a change. Keep only Expression and Conformance; derive activity per part.

An empty new Pack is Expression. Do not invent Decisions to make setup look finished. Do not require both a conformance folder and an expression folder.
