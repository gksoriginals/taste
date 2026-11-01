---
name: taste-expression
description: Use Expression for greenfield UI, new requirements or taste, unsupported decisions, and user corrections. Keep iteration feedback in the host's active task. After relevant checks pass and the user approves the exact tested artifact, automatically record the reusable Decision in the Pack without asking for separate Pack or Decision-text confirmation.
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

1. Check whether `<repo>/taste/` exists. If it does, call `taste_pack_inspect` and call `taste_part_state` with the affected `scope` and required `taskIntent` (`new_direction`, `correction`, `gap`, `greenfield`, or `unclear`). Its `taskRouting` must say Expression even when the durable scope remains Conformance. Read relevant Decisions, product facts, and the product entry Skill. If it does not, do not call Pack tools yet; proceed as Expression with transient host-task context.
2. Detect whether this task needs specialist craft beyond the Pack, such as visual composition, interaction design, UX flow, or product-decision elicitation. Check skills and plugins already available in the host. Use relevant installed capabilities according to the host's normal workflow; Taste does not rank them or require particular names.
3. If no suitable capability is already available, explain the gap and ask the user before searching the internet or installing anything. After search is approved, present relevant candidates and get approval for the chosen installation. The host performs discovery and installation; Taste supplies no shortlist and never installs silently. If the user declines, continue with the host's available capabilities and the Pack.
4. Try an approved capability on the current product task. Assess its usefulness on the artifact and workflow with the host's normal review. Keep trial results and feedback in the active host task; an installed skill does not become a Pack Decision.
5. Ask whether to keep a capability when the trial is complete. If the user wants to keep it, record its identity, version/source, and intended scope in a host-supported product or harness workflow location. The host owns that location and future activation. If no suitable persistent location exists, say the lock is session-only; do not put the catalog or lock in the Taste Pack.
6. Ask focused questions in the host conversation. Keep user answers, options, rejected drafts, and feedback in the active host task while the design is changing. Do not create provisional Decision files or other scratch memory inside `taste/`.
7. When the user likes a direction, acknowledge that milestone to the host. Continue the product's own implementation and validation workflow. Do not interpret that reaction as approval of the final tested artifact or write to the Pack.
8. Consult the optional `decisionPromotionCheckpoint` in `taste/manifest.json`. It is only a reminder about when the host should invoke Taste. If absent, use the host's existing workflow point after relevant checks pass and the user approves the tested artifact. The host chooses its own checks and whether this point is before or after push.
9. At that checkpoint, the user's approval of the exact tested artifact is the promotion signal. Derive a concise reusable Decision from the user's request and the confirmed final result, then record it automatically; do not ask for a second confirmation to write the Pack or approve the Decision wording. If the Pack is absent, call `taste_pack_initialize`, then `taste_record_signal`. An agent's review or recommendation is not user approval. If the user has not approved the tested artifact, continue iteration in the host task and leave `taste/` absent or unchanged.

Do not create a Taste-owned skill shortlist, catalog, ranking, benchmark, or skill lock. Formal comparison/benchmarking is deferred until a product workflow has user-approved locked capabilities and there is evidence to measure.

## Record the finalized Decision

The host supplies its own evidence; Taste stores the report and does not verify the claims.

- `status`: `accepted`
- `validatedArtifact`: stable reference to the exact artifact that passed the host's relevant checks
- `validationEvidence`: host-reported checks and evidence chosen by that product's workflow
- `userApprovedArtifact`: the same artifact reference as `validatedArtifact`
- `userApprovalEvidence`: brief host-reported evidence that the user approved that exact tested artifact; no separate Decision-text approval is required
- `coverageGap`: `false`
- `trigger`: `interview`, `gap`, or `rejected_pass`, as appropriate
- `shippedEvidence`: include only if the host actually inspected the shipped version; omit before push

If a Decision is recorded before push, it remains Expression until the host later supplies inspected shipped evidence for the same artifact. If the artifact changes, the host must revalidate and get approval for that version before updating the Decision; prior shipped evidence is cleared when the artifact reference changes.

When a gap remains unresolved or the user has not approved the tested artifact, do not call `taste_record_signal`. Continue using the host's active task context. Do not encode an unresolved gap as Pack knowledge.

For UI copy, use targeted clarity edits and preserve facts, constraints, and product voice. A phrase list or scanner match alone is not evidence that copy is wrong and does not authorize a rewrite.

After a successful Pack update, call `taste_part_state` with `taskIntent: inspect_only` and report which scopes derive Expression or Conformance. Conformance requires accepted status, complete matching validation and approval evidence, shipped evidence, and no coverage gap.
