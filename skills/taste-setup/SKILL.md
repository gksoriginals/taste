---
name: taste-setup
description: Set up Taste in a product repository. Use when the user asks to install Taste, initialize a Pack, create a taste/ directory, or prepare design judgment for a codebase. Creates one shared Pack. For an existing UI, continue into taste-sweep; for greenfield or missing judgment, continue into taste-expression. Does not start a daemon or add a CI gate.
---

# Set up a Taste Pack

The harness coding agent performs setup. This plugin is already the Taste install. Do not configure or host another agent, daemon, or CI gate.

1. Identify the target product repository. Inspect `taste/`. If it exists, call `taste_pack_inspect` and continue it. Never overwrite it. If it is absent, call `taste_pack_initialize` with the repository path and product name. Initialization creates one shared Pack with `references/decisions/`. It does not create separate Conformance and Expression trees, and it does not edit `AGENTS.md` or harness config.
2. Ask which part to capture first when the repo does not make that obvious. Prefer a narrow surface over a whole-product sweep.
3. Branch on what already exists. Do not fabricate taste to look finished.
   - The product already has UI for this part: follow `taste-sweep` and record proposed Decisions with trigger `sweep`.
   - The part is greenfield, or the user wants to state taste directly: follow `taste-expression` and record signals with trigger `interview`.
4. Call `taste_pack_validate`, then `taste_part_state`. Summarize what is proposed, what is accepted, what is missing, and which parts still derive to Expression.
5. Tell the user the Pack lives in their product repo at `taste/`, not in the Taste plugin repo.

A new Pack with no Decisions derives to Expression. That is expected. Do not mark the Pack Conformance because the starter files exist. Do not author a `supportedModes` field. Legacy Packs that still have split reference folders remain readable; new work goes into `references/decisions/`.
