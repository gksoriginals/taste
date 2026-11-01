---
name: taste-pack
description: Maintain a product Taste Pack. Use when inspecting, validating, or editing taste/ Decisions, reviewing candidate guidance, or checking Pack structure. For first-time setup use taste-setup. For a visual sweep of shipped UI use taste-sweep. For interviews, new requirements, gaps, and corrections use taste-expression.
---

# Maintain one Pack

The harness coding agent interprets evidence. Taste tools read and write files inside the product repository's `taste/` directory.

## Where finalized judgment lives

Decisions are Markdown files in `skills/product-design/references/decisions/`, written with `taste_record_signal` only at the configured promotion checkpoint. A Decision must identify the same validated and user-approved artifact, include host-reported validation and approval evidence, and have no unresolved coverage gap. Approval of the tested artifact authorizes recording the concise reusable Decision derived from the request and confirmed result; do not ask for separate Pack-write or Decision-text confirmation. Conformance additionally requires inspected shipped evidence. Taste stores the host's reports; it does not run checks, judge readiness, conduct user review, or push. There is no mode field. `supportedModes` on old manifests is deprecated and is not product truth.

Legacy Packs may still have `references/conformance/` and `references/expression/`. Keep reading them. Put new and updated signals in `decisions/` rather than growing the split trees.

## Update rules

- `taste_pack_initialize` creates `taste/` and fails if that directory exists. Use it immediately for an explicit setup request; for a design task with no Pack, wait until the user approves the tested artifact, then initialize and record its Decision without another confirmation. It does not edit harness instructions.
- Inspect and validate before and after Pack maintenance. `taste_pack_write` can edit notes, facts, Skills, and fixtures inside `taste/`, but it cannot write Decision files. `taste_record_signal` is the only Decision write path and requires finalization evidence.
- Keep interview answers, early positive reactions, corrections, gaps, and rejected versions in the host's active task context. Do not save them as proposed Decisions.
- When the final tested artifact is approved, automatically derive and record its reusable Decision; update the same Decision id with the appropriate trigger. Include host-reported validation evidence and exact artifact approval. If artifact changes, revalidate and obtain approval for that changed artifact before updating the Decision.
- The optional `decisionPromotionCheckpoint` in `manifest.json` is plain-language reminder text for the host. It does not configure or execute the host's workflow.
- Preserve uncertainty. One screenshot is not a universal rule.
- `taste_part_state` requires `taskIntent`, reports durable per-part activity, and adds a separate task-local Expression route for new directions, corrections, gaps, greenfield work, or unclear requests. The host interprets the current request and supplies `taskIntent`; the tool cannot read conversation text. A task-local route never changes the Pack or unrelated scopes.

For evaluation fixtures, use `taste-evaluate`. Fixture lanes named conformance and expression are storage paths, not Pack modes.
