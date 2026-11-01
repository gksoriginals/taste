# Taste workflow triggers

Taste's commands are Skills in the Agent Plugins package. Harnesses expose them through their own skill picker. The descriptions in each `SKILL.md` frontmatter are what a skill router should match. [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), [Cursor plugin reference](https://cursor.com/docs/reference/plugins), [Claude Code Skills](https://code.claude.com/docs/en/skills).

| Workflow | When the harness should select it | What it does |
| --- | --- | --- |
| `taste-setup` | "Set up Taste", "initialize a Pack", "create taste/". | Create or continue one Pack. Then Sweep if UI exists, or Expression if the part is greenfield. |
| `taste-sweep` | "Sweep", "learn the existing UI", "extract taste from the product". | Inspect rendered UI and write `proposed` Decisions with trigger `sweep`. |
| `taste-design` | Any UI, UX, screen, or frontend task. | Load the Pack before designing. Conformance only where part state qualifies; otherwise Expression for that part. |
| `taste-conformance` | "Match the existing taste" or part state is accepted + shipped + no gap. | Apply those Decisions. If the part does not qualify, hand it to Expression. |
| `taste-expression` | New taste, an interview, a from-scratch part, a gap, or a correction of shipped or generated UI. Also when part state derives Expression. | Interview in the conversation and call `taste_record_signal`. |
| `taste-pack` | Edit or review Pack files. | Inspect, validate, and keep Decisions in `references/decisions/`. |
| `taste-evaluate` | Explicit eval or calibration. | Paired with/without-Skill runs and a separate Judge packet. |

## How a part is chosen

Call `taste_part_state` after the Pack is loaded. Conformance means every Decision in that scope is `accepted`, has shipped evidence, and has `coverage_gap: false`. Any other Decision, or no Decision, is Expression for that part. The Pack does not flip as a whole.

User intent also routes into Expression: a request for new taste, a correction, or greenfield judgment. That does not rewrite unrelated Decisions.

`taste_mode_resolve` is a deprecated helper. It does not read the Pack and it does not decide who starts Expression. Who initiates an ∞ change stays open.

An empty new Pack is Expression. Do not invent Decisions to make setup look finished. Do not require both a conformance folder and an expression folder.
