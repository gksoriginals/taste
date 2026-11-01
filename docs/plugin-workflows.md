# Taste workflow triggers

Taste's commands are Skills in the Agent Plugins package. Harnesses expose them through their own skill picker. The descriptions in each `SKILL.md` frontmatter are what a skill router should match. [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), [Cursor plugin reference](https://cursor.com/docs/reference/plugins), [Claude Code Skills](https://code.claude.com/docs/en/skills).

| Workflow | When the harness should select it | What it does |
| --- | --- | --- |
| `taste-setup` | "Set up Taste", "initialize a Pack", "create taste/". | Create or continue one Pack. Then Sweep if UI exists, or Expression if the part is greenfield. |
| `taste-sweep` | "Sweep", "learn the existing UI", "extract taste from the product". | Inspect rendered UI and keep candidate judgments in the host task until the owner approves and host-reported validation is ready. |
| `taste-design` | Any UI, UX, screen, or frontend task. | Load the Pack before designing. Conformance only where part state qualifies; otherwise Expression for that task/part. |
| `taste-conformance` | "Match the existing taste" or part state derives Conformance. | Apply only Decisions with complete host-reported validation and user approval, shipped evidence, and no gap. New direction or correction goes through Expression. |
| `taste-expression` | New taste, an interview, a from-scratch part, a gap, or a correction. Also when part state derives Expression. | Interview and iterate in the host task. A positive reaction to an early direction nudges the host to continue its own workflow. Call `taste_record_signal` only after the final tested artifact and Decision are approved. |
| `taste-pack` | Edit or review Pack files. | Inspect and validate Pack files. Decision files can only be changed through the finalized `taste_record_signal` path. |
| `taste-evaluate` | Explicit eval or calibration. | Paired with/without-Skill runs and a separate Judge packet. |

## How a part is chosen

Call `taste_part_state` after the Pack is loaded. Conformance means every Decision in that scope is `accepted`, includes matching host-reported validation and user-approval evidence, has shipped evidence, and has `coverage_gap: false`. Any other Decision, or no Decision, is Expression for that part. The Pack does not flip as a whole.

User intent also routes the current task into Expression: a request for new taste, a correction, or greenfield judgment. That does not rewrite unrelated Decisions. Keep early feedback, rejected drafts, and unresolved gaps in the host's active task context; do not write proposed Decisions to the Pack.

The optional `decisionPromotionCheckpoint` in `taste/manifest.json` is plain-language reminder text for when the host should invoke Taste. It does not define product checks or approval steps, observe test results, or trigger a push. The host owns those workflows. `taste_record_signal` stores the host's report that checks passed and that the user approved the same artifact and Decision; Taste does not verify those claims.

`taste_mode_resolve` is deprecated. It does not read the Pack or decide who starts a change. Keep only Expression and Conformance; derive activity per part.

An empty new Pack is Expression. Do not invent Decisions to make setup look finished. Do not require both a conformance folder and an expression folder.
