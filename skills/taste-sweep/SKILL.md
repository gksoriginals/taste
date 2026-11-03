---
name: taste-sweep
description: Inspect an existing product's shipped UI to find candidate design judgments, whether or not a Taste Pack exists. Keep candidates in the host's active task until the product owner approves the inspected artifact and final Decision and the host reports applicable inspection/validation evidence; then initialize a missing Pack or update the existing one.
---

# Sweep shipped UI into approved Decisions

The host gathers and evaluates evidence. Taste provides the Pack and records finalized Decisions. A sweep does not write candidate Decisions to the Pack.

1. Check whether `taste/` exists. If present, call `taste_pack_inspect` and `taste_part_state` with `taskIntent: inspect_only` before work. If absent, proceed with the sweep without Pack tools; keep findings in the host task until promotion.
2. Inspect a focused flow in the running product with the host's browser or computer-use tools. Open the pages, follow the primary path and relevant alternates, and capture screenshots. Note URL or page, date, viewport, state, and what each capture shows. Include empty, loading, error, and success states when relevant.
3. Correlate with source, Git history, reviews, and design references when available. If evidence is missing, report the gap and keep the candidate in the host task context. Never claim a screen was seen if it was not. Do not store private production data without authorization.
4. Draft concise candidate judgments in the host task. Show them to the product owner. Do not create `proposed` Decision files during a sweep.
5. After the owner approves the exact inspected shipped artifact and candidate Decision, and the host reports applicable inspection/validation evidence, initialize a Pack if absent, then call `taste_record_signal` with `status: accepted`, the same artifact reference as validated and user-approved, host-reported evidence, and approval evidence. For an existing product sweep, validation evidence can describe the host's inspection and any applicable product checks; do not imply a new implementation or test run occurred. Include `shippedEvidence` for the UI actually inspected. An agent review is not owner approval. Taste does not decide which checks apply or run them.
6. Read `decisionPromotionCheckpoint` in the Pack manifest if configured. It guides when the host calls Taste; it does not configure test execution, review, or push behavior. Validate the Pack and call `taste_part_state` with `taskIntent: inspect_only` after the update.

Conformance still requires an accepted Decision, complete matching promotion evidence, inspected shipped evidence, and no coverage gap. Other parts remain in their existing derived activity.
