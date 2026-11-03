---
name: taste-pack
description: Maintain a product Taste Pack. Use when inspecting, validating, or editing taste/ Decisions, reviewing candidate guidance, or checking Pack structure. For first-time setup use taste-setup. For a visual sweep of shipped UI use taste-sweep. For interviews, new requirements, gaps, and corrections use taste-expression.
---

# Maintain one Pack

The harness coding agent interprets evidence. Taste tools read and write files inside the product repository's `taste/` directory.

## Where finalized judgment lives

Scoped checklist references under `skills/product-design/references/checklists/` are the default place for whole-product sweep guidance and reusable lessons from user corrections, rejections, and disagreements. The host self-checks and updates them with `taste_pack_write` in the current task; no review or promotion approval is needed. `taste_record_signal` remains a legacy format for structured Decisions and retains its validation/approval evidence requirements. `taste_part_state` derives activity only from those legacy records, so checklist guidance should still be loaded independently. There is no Pack-wide mode field. `supportedModes` on old manifests is deprecated and is not product truth.

Legacy Packs may still have `references/conformance/` and `references/expression/`. Keep reading them. Put new and updated signals in `decisions/` rather than growing the split trees.

## Update rules

- `taste_pack_initialize` creates a scaffold and fails if `taste/` already exists. For a product with existing UI, first complete a whole-product sweep, self-review it, then initialize and populate a tailored Skill, references, checklists, and metadata. For greenfield work, capture reusable lessons as they emerge in the conversation. The scaffold alone is not a completed Pack and does not edit harness instructions.
- Inspect and validate before and after Pack maintenance. `taste_pack_write` can edit checklists, facts, Skills, references, metadata, and fixtures inside `taste/`, but it cannot write legacy Decision files. `taste_record_signal` retains its structured validation/approval contract for those records.
- Keep unresolved options, one-off reactions, and rejected versions in the host's active task. When user feedback yields a reusable correction, update the relevant checklist after applying and self-checking it.
- No separate review or promotion is required to update a checklist. The user can keep collaborating and correct a checklist item in the same ongoing task.
- The optional `decisionPromotionCheckpoint` in `manifest.json` is plain-language reminder text for the host. It does not configure or execute the host's workflow.
- Preserve uncertainty. One screenshot is not a universal rule.
- `taste_part_state` requires `taskIntent`, reports durable per-part activity, and adds a separate task-local Expression route for new directions, corrections, gaps, greenfield work, or unclear requests. The host interprets the current request and supplies `taskIntent`; the tool cannot read conversation text. A task-local route never changes the Pack or unrelated scopes.

For evaluation fixtures, use `taste-evaluate`. Fixture lanes named conformance and expression are storage paths, not Pack modes.
