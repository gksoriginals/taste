---
name: taste-setup
description: Initialize a Taste Pack when the user explicitly asks for setup, after approval of a tested greenfield artifact, or after approval of a Decision derived from inspected existing UX.
---

# Initialize a Taste Pack at the right checkpoint

The harness coding agent performs setup. This plugin is already the Taste install. Do not configure or host another agent, daemon, or CI gate.

1. Identify the target product repository. If `taste/` exists, call `taste_pack_inspect` and continue it. Never overwrite it.
2. If `taste/` is absent, distinguish an explicit setup request from a UI task. Initialize immediately only when the user explicitly asks to set up or create the Pack. Otherwise use `taste-design` to branch: sweep an existing UI and initialize after the owner approves a captured Decision; use transient Expression for greenfield UI and initialize after the user approves its tested artifact.
3. For a greenfield UI task with no Pack, initialize only after the host reports relevant checks passed and the user approves the exact tested artifact. Derive the reusable Decision from the request and confirmed result, then call `taste_pack_initialize` and `taste_record_signal` automatically without asking for separate Pack-write or Decision-text confirmation. If the product owner specified a `decisionPromotionCheckpoint`, pass it as optional reminder text. Otherwise follow the host's existing workflow. Initialization creates one shared Pack; it does not create separate Conformance and Expression trees or edit `AGENTS.md` or harness config.
4. Ask which part to capture first when the repo does not make that obvious. Prefer a narrow surface over a whole-product sweep.
5. Branch on what already exists. Do not fabricate taste to look finished.
   - The product already has UI for this part: follow `taste-sweep`. Keep candidate judgments in the host task until the owner approves the inspected shipped artifact and Decision and the host supplies applicable inspection/validation evidence. Then initialize and record the accepted Decision.
   - The part is greenfield, or the user wants to state taste directly: follow `taste-expression`. Keep feedback in the host task while the UI is developed and reviewed.
6. After initialization, call `taste_pack_validate`, then `taste_part_state` with `taskIntent: inspect_only`. Summarize finalized Decisions, what is missing, and which parts still derive to Expression.
7. Tell the user the Pack lives in their product repo at `taste/`, not in the Taste plugin repo.

A new Pack with no Decisions derives to Expression. That is expected. Do not mark the Pack Conformance because the starter files exist. Do not create a proposed Decision during setup. Do not author a `supportedModes` field. Legacy Packs that still have split reference folders remain readable; finalized Decisions go into `references/decisions/`.
