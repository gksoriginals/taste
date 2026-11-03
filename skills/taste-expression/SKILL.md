---
name: taste-expression
description: Use Expression for greenfield UI, new requirements or taste, unsupported decisions, and user corrections. Learn in the active conversation; update reusable checklists only in an existing complete Pack after host self-check.
---

# Expression explores new directions with the user

Expression describes an approach for a task that explores a new direction, addresses a gap, or responds to a user correction. It interviews, explores, and iterates in the host conversation. Existing Pack guidance may still apply while exploring. Keep unresolved options transient; for a complete Pack, resolved reusable user feedback can update a relevant checklist after the host applies and self-checks it. There is no persistent per-task activity state or separate promotion checkpoint.

The harness owns the agent loop and product workflow. Taste does not run tests or push changes. The host can self-check and maintain the Pack; no separate human review step is required.

## When to use this approach

Use Expression when the request asks for a new direction, surfaces unsupported product guidance, identifies a gap, or corrects an existing choice. Use Conformance when applying established, sourced guidance. Ask a focused clarification when the task or scope remains materially ambiguous. These are host judgments for the current task, not persisted Pack state.

## Work through the direction

1. If a Pack exists, inspect it and read guidance only for evidence-backed coverage relevant to this task/surface. Do not call `taste_part_state` for checklist-based routing. If setup is `in_progress` or no Pack exists, do not use starter guidance or write setup files; proceed with repository evidence and transient host-task context.
2. Detect whether this task needs specialist craft beyond the Pack, such as visual composition, interaction design, UX flow, or product-decision elicitation. Check skills and plugins already available in the host. Use relevant installed capabilities according to the host's normal workflow; Taste does not rank them or require particular names.
3. If no suitable capability is already available, explain the gap and ask the user before searching the internet or installing anything. After search is approved, present relevant candidates and get approval for the chosen installation. The host performs discovery and installation; Taste supplies no shortlist and never installs silently. If the user declines, continue with the host's available capabilities and the Pack.
4. Try an approved capability on the current product task. Assess its usefulness on the artifact and workflow with the host's normal review. Keep trial results and feedback in the active host task; an installed skill does not become a Pack Decision.
5. Ask whether to keep a capability when the trial is complete. If the user wants to keep it, record its identity, version/source, and intended scope in a host-supported product or harness workflow location. The host owns that location and future activation. If no suitable persistent location exists, say the lock is session-only; do not put the catalog or lock in the Taste Pack.
6. Ask focused questions in the host conversation. Keep options and unresolved disagreement in the active task while designing. When the user rejects a direction or corrects the host, treat that as direct evidence, revise the work, and note the change and source in task context.
7. After resolving the feedback, identify the reusable lesson and express it as an observable checklist item: what to check, when it applies, why it matters, exceptions, and a source to the user correction and resulting artifact. Keep one-time or ambiguous feedback transient; only generalize a clear, reusable lesson. Write it only when a complete Pack already exists; otherwise keep it task-local until the user invokes `/taste-setup`.
8. Self-check the implemented change with the host's available product workflow. If a complete `taste/` Pack exists and the result establishes reusable product guidance, update its relevant checklist with `taste_pack_write`; do not call `taste_record_signal` for routine interaction learning. If no Pack exists, keep the lesson in the active task and tell the user they can invoke `/taste-setup` separately. Never initialize or create Pack files during this routine UI task.
9. Report the change and, when an existing complete Pack was updated, the checklist item recorded. The user can correct it in the same conversation; update that existing checklist after applying and self-checking the correction. If there is no complete Pack, say the lesson stayed in the task and offer `/taste-setup`.

Do not create a Taste-owned skill shortlist, catalog, ranking, benchmark, or skill lock. Formal comparison/benchmarking is deferred until a product workflow has user-approved locked capabilities and there is evidence to measure.

## Structured Decision records

Routine resolved reusable user corrections may update a relevant checklist in an existing complete Pack with `taste_pack_write`; they do not need separate Decision promotion or approval. Without an existing complete Pack, keep feedback task-local. `taste_record_signal` remains available for legacy structured Decision records only and is not part of this learning loop. Never encode unresolved disagreement or a one-off preference as a reusable checklist item.

For UI copy, use targeted clarity edits and preserve facts, constraints, and product voice. A phrase list or scanner match alone is not evidence that copy is wrong and does not authorize a rewrite.

After a successful Pack update, report the checklist references updated. Use `taste_part_state` only when diagnosing a legacy structured Decision Pack, not as the normal routing authority.
