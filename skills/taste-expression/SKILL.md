---
name: taste-expression
description: Use Expression for greenfield UI, new requirements or taste, unsupported decisions, and user corrections. Learn in the active conversation, revise from user feedback, and automatically capture reusable checklist items in the Taste Pack after the host self-checks the result; no separate human review or promotion approval.
---

# Expression learns with the user; the host maintains reusable checklists

Expression is the learning activity for a part whose direction is new, missing, or unsupported by the Pack. It interviews, explores, and iterates in the host conversation. Keep unresolved options transient, but turn resolved, reusable user corrections or disagreements into checklist items automatically after the host applies the feedback and self-checks the result. Do not require a separate Pack review or promotion checkpoint. There are only two derived activities: Expression and Conformance.

The harness owns the agent loop and product workflow. Taste does not run tests or push changes. The host can self-check and maintain the Pack; no separate human review step is required.

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
6. Ask focused questions in the host conversation. Keep options and unresolved disagreement in the active task while designing. When the user rejects a direction or corrects the host, treat that as direct evidence, revise the work, and note the change and source in task context.
7. After resolving the feedback, identify the reusable lesson and express it as an observable checklist item: what to check, when it applies, why it matters, exceptions, and a source to the user correction and resulting artifact. Keep one-time or ambiguous feedback transient; only generalize a clear, reusable lesson.
8. Self-check the implemented change with the host's available product workflow. If `taste/` is absent and the result establishes reusable product guidance, initialize a Pack and populate the tailored entry Skill/reference plus `references/checklists/<surface>.md`. Use `taste_pack_write`; do not call `taste_record_signal` for routine interaction learning. Do not ask the user to approve the checklist or Decision wording.
9. Report the change and the checklist item recorded, including any uncertainty or remaining gap. The user can correct it in the same ongoing conversation; apply that correction and update the checklist without a separate review or promotion step. A configured `decisionPromotionCheckpoint` is not required for this learning loop.

Do not create a Taste-owned skill shortlist, catalog, ranking, benchmark, or skill lock. Formal comparison/benchmarking is deferred until a product workflow has user-approved locked capabilities and there is evidence to measure.

## Structured Decision records

Routine user corrections, rejected design options, and collaboration history belong in reusable checklist references written with `taste_pack_write`; they do not need a separate Decision promotion or approval. `taste_record_signal` remains available for legacy structured Decision records only and is not part of this learning loop. Never encode unresolved disagreement or a one-off preference as a reusable checklist item.

For UI copy, use targeted clarity edits and preserve facts, constraints, and product voice. A phrase list or scanner match alone is not evidence that copy is wrong and does not authorize a rewrite.

After a successful Pack update, call `taste_part_state` with `taskIntent: inspect_only` when available and report the checklist references updated. Checklist guidance is loaded by scope even when structured Decision state still derives Expression.
