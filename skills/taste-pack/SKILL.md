---
name: taste-pack
description: Maintain a product Taste Pack. Use when inspecting, validating, or editing taste/ Decisions, reviewing candidate guidance, or checking Pack structure. For setup use the explicitly invoked `taste-setup` / `/taste-setup` workflow. For a visual sweep of shipped UI use taste-sweep. For interviews, new requirements, gaps, and corrections use taste-expression.
---

# Maintain one Pack

The harness coding agent interprets evidence. Taste tools read and write files inside the product repository's `taste/` directory.

## Where finalized judgment lives

Scoped checklist references under `skills/product-design/references/checklists/` are the default place for bounded product-sweep guidance and reusable lessons from user corrections, rejections, and disagreements. During normal UI work, the host may update an existing complete Pack checklist with `taste_pack_write` after applying and self-checking clear reusable user feedback; no separate approval is needed. New Pack setup or broader Pack maintenance requires explicit user invocation. Before a broad refresh, set `setupStatus: incomplete`; only mark complete after the refresh passes validation. `taste_record_signal` remains a legacy format for structured Decisions and retains its validation/approval evidence requirements. `taste_part_state` reports activity only for those legacy records; checklist guidance is routed independently by task and surface. There is no Pack-wide mode field. `supportedModes` on old manifests is deprecated and is not product truth.

Legacy Packs may still have `references/conformance/` and `references/expression/`. Keep reading them. Put new and updated signals in `decisions/` rather than growing the split trees.

## Update rules

- `taste_pack_initialize` creates an incomplete, non-overwriting shell and fails if `taste/` already exists. For first-time setup, use it only after explicit `/taste-setup` has inspected the repository and rendered some product UI in the chosen scope. Do not initialize when no product UI exists or none of the chosen scope can be rendered. If some UI is accessible but important auth coverage is blocked, create only the supported subset and keep the Pack incomplete. For refresh, inspect the existing Pack first and preserve useful content. Resume an incomplete Pack instead of initializing again. Normal UI work never creates or refreshes setup. The shell is not a completed Pack and does not edit harness instructions.
- Inspect and validate before and after Pack maintenance. `taste_pack_write` can edit checklists, facts, Skills, references, metadata, and fixtures inside `taste/`, but it cannot write legacy Decision files. `taste_record_signal` retains its structured validation/approval contract for those records.
- Keep unresolved options, one-off reactions, and rejected versions in the host's active task. When user feedback yields a reusable correction and a complete Pack exists, update its relevant checklist after applying and self-checking it. If the Pack is absent or incomplete, keep the learning transient until setup is explicitly invoked or resumed.
- No separate review or promotion is required to update a checklist. The user can keep collaborating and correct a checklist item in the same ongoing task.
- The optional `decisionPromotionCheckpoint` in `manifest.json` is plain-language reminder text for the host. It does not configure or execute the host's workflow.
- Preserve uncertainty. One screenshot is not a universal rule.
- Route ordinary work from the user's task and affected product surface. Choose Conformance to apply established sourced guidance, Expression to explore a new direction or address a gap/correction, or clarify when intent or scope is materially unclear. `taste_part_state` is only for legacy structured Decision compatibility or diagnostics; it is not the normal router for checklist-based Packs.

For evaluation fixtures, use `taste-evaluate`. Fixture lanes named conformance and expression are storage paths, not Pack modes.
