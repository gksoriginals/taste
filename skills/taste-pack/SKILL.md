---
name: taste-pack
description: Maintain a product Taste Pack. Use when inspecting, validating, or editing taste/ Decisions, reviewing candidate guidance, or checking Pack structure. For first-time setup use taste-setup. For a visual sweep of shipped UI use taste-sweep. For interviews, new requirements, gaps, and corrections use taste-expression.
---

# Maintain one Pack

The harness coding agent interprets evidence. Taste tools read and write files inside the product repository's `taste/` directory.

## Where judgment lives

Decisions are Markdown files in `skills/product-design/references/decisions/`, written with `taste_record_signal`. Derived activity comes from `status`, `shipped`, and `coverage_gap`. There is no mode field. `supportedModes` on old manifests is deprecated and is not product truth.

Legacy Packs may still have `references/conformance/` and `references/expression/`. Keep reading them. Put new and updated signals in `decisions/` rather than growing the split trees.

## Update rules

- Initialize only when the user asks. `taste_pack_initialize` creates `taste/` and fails if that directory exists. It does not edit harness instructions.
- Inspect and validate before and after edits. `taste_pack_write` is the escape hatch for notes, facts, and fixtures inside `taste/`. Expression and Sweep should prefer `taste_record_signal` so part state stays derivable.
- Do not mark a Decision `accepted` without the user confirming the statement. A sweep stays `proposed`.
- A correction updates the same Decision id with trigger `gap` or `rejected_pass`. It does not create a second Pack.
- Preserve uncertainty. One screenshot is not a universal rule.
- `taste_part_state` reports per-part activity. It does not decide who initiates a change, and it does not flip the Pack.

For evaluation fixtures, use `taste-evaluate`. Fixture lanes named conformance and expression are storage paths, not Pack modes.
