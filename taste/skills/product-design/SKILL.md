---
name: product-design
description: Apply Taste's product-specific design judgment when creating, implementing, or reviewing software UI. Load this Pack before UI work.
---

# Product design guidance for Taste

This is the entry point for one Taste Pack. Decisions live under `references/decisions/`. There is no mode field on a Decision and no separate Conformance or Expression tree.

## Derived part activity

Read Decisions and call `taste_part_state` before UI work. Activity is derived, not authored:

- **Conformance:** the Decision is `accepted`, includes matching host-reported validation and user-approval evidence, has shipped evidence, and `coverage_gap` is false. Use that taste for UI.
- **Expression:** anything else — no Decision, a legacy or unapproved Decision, missing promotion evidence, accepted but not shipped, or a coverage gap. The host keeps iteration feedback in its active task and records only a finalized Decision with `taste_record_signal`.
- **User intent:** a request for new taste, a correction, or greenfield judgment uses Expression for that task, even when other Decisions are Conformance.

The Pack never flips as a whole. The host owns checks, user review, readiness, and push timing. Taste stores host-reported evidence; it does not run or judge checks. The optional `decisionPromotionCheckpoint` in the manifest is reminder text only. Do not add another mode or put host workflow inside the Pack. `taste_mode_resolve` is deprecated and is not the product rule.

## Apply this Pack

Read `references/shared/product-facts.md` and the Decisions that touch the task. Treat shipped work as evidence, not a requirement to copy known flaws. Keep uncertainty visible.

For a discovery refresh of an existing UI, follow `taste-sweep` and capture screenshots. For a product that does not have the judgment yet, follow `taste-expression`. When the user likes an early direction, continue the host's workflow without writing to the Pack. Record only after the host reports relevant checks passed and the user approved the exact tested artifact and Decision. When implementing or reviewing visible UI, use the harness's available browser, computer, or rendered-preview tools when needed and report what you actually inspected.
