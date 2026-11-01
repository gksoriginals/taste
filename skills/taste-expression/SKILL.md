---
name: taste-expression
description: Use Expression for greenfield UI, new requirements or taste, unsupported decisions, and user corrections. Keep iteration feedback in the host's active task. Record a Decision in the Pack only after the host reports its relevant checks passed and the user approved the exact tested artifact and Decision.
---

# Expression explores; the host promotes finalized Decisions

Expression is the learning activity for a part whose direction is new, missing, or unsupported by the Pack. It interviews, explores, and iterates in the host conversation. It does not write drafts, early user reactions, or unresolved gaps into the durable Pack. There are only two derived activities: Expression and Conformance.

The harness owns the agent loop and product workflow. Taste does not run tests, decide readiness, perform user review, or push changes.

## When Expression applies

- The product or part is greenfield, or the Pack has no Decision for it.
- The user requests a new direction or requirement not justified by an accepted shipped Decision.
- The current task contains a correction, rejection, or gap, even if an older Decision still derives Conformance for that part.
- `taste_part_state` reports Expression for the part.

Other parts remain in their current derived activity. Do not flip the Pack or add another mode.

## Work through the direction

1. Check whether `<repo>/taste/` exists. If it does, call `taste_pack_inspect` and `taste_part_state`; read relevant Decisions, product facts, and the product entry Skill. If it does not, do not call Pack tools yet; proceed as Expression with transient host-task context.
2. Ask focused questions in the host conversation. Keep user answers, options, rejected drafts, and feedback in the active host task context while the design is changing. Do not create provisional Decision files or other scratch memory inside `taste/`.
3. When the user likes a direction, acknowledge that milestone to the host. Continue the product's own implementation and validation workflow. Do not interpret that reaction as approval of the final tested artifact or write to the Pack.
4. Consult the optional `decisionPromotionCheckpoint` in `taste/manifest.json`. It is only a reminder about when the host should invoke Taste. If absent, use the host's existing workflow point after its relevant checks pass and the user approves the tested artifact and proposed Decision. The host chooses its own checks and whether this point is before or after push.
5. At that checkpoint, show the user the tested artifact and the concise reusable Decision. An agent's review or recommendation is not user approval. If the Pack is absent, call `taste_pack_initialize` only after the user approves both, then call `taste_record_signal`. If the user has not approved, continue iteration in the host task and leave `taste/` absent or unchanged.

## Record the finalized Decision

The host supplies its own evidence; Taste stores the report and does not verify the claims.

- `status`: `accepted`
- `validatedArtifact`: stable reference to the exact artifact that passed the host's relevant checks
- `validationEvidence`: host-reported checks and evidence chosen by that product's workflow
- `userApprovedArtifact`: the same artifact reference as `validatedArtifact`
- `userApprovalEvidence`: brief host-reported evidence that the user approved that artifact and Decision
- `coverageGap`: `false`
- `trigger`: `interview`, `gap`, or `rejected_pass`, as appropriate
- `shippedEvidence`: include only if the host actually inspected the shipped version; omit before push

If a Decision is recorded before push, it remains Expression until the host later supplies inspected shipped evidence for the same artifact. If the artifact changes, the host must revalidate and get approval for that version before updating the Decision; prior shipped evidence is cleared when the artifact reference changes.

When a gap remains unresolved or the user has not approved the tested artifact and Decision, do not call `taste_record_signal`. Continue using the host's active task context. Do not encode an unresolved gap as Pack knowledge.

For UI copy, use targeted clarity edits and preserve facts, constraints, and product voice. A phrase list or scanner match alone is not evidence that copy is wrong and does not authorize a rewrite.

After a successful Pack update, call `taste_part_state` and report which scopes derive Expression or Conformance. Conformance requires accepted status, complete matching validation and approval evidence, shipped evidence, and no coverage gap.
