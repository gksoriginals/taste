---
name: taste-expression
description: Use Expression for greenfield UI, new requirements or taste, unsupported decisions, and user corrections. Keep learning in the conversation, then save clear reusable lessons to scoped Pack guidance or create a minimal surface-scoped Pack.
---

# Expression explores new directions with the user

Expression describes an approach for a task that explores a new direction, addresses a gap, or responds to a user correction. It interviews, explores, and iterates in the host conversation. Existing Pack guidance may still apply while exploring. Keep unresolved options transient; resolved reusable feedback can update scoped guidance or create a minimal Pack for the affected surface after the host applies and self-checks it. There is no persistent per-task activity state or separate promotion checkpoint.

The harness owns the agent loop and product workflow. Taste does not run tests or push changes. The host can self-check and maintain the Pack; no separate human review step is required.

## When to use this approach

Use Expression when the request asks for a new direction, surfaces unsupported product guidance, identifies a gap, or corrects an existing choice. Use Conformance when applying established, sourced guidance. Ask a focused clarification when the task or scope remains materially ambiguous. These are host judgments for the current task, not persisted Pack state.

## Work through the direction

1. If a Pack exists, inspect it and read guidance only for evidence-backed coverage relevant to this task/surface. If setup is `in_progress` or no Pack exists, do not use starter guidance; proceed with repository evidence and transient host-task context until the user feedback yields a clear reusable lesson.
2. Detect whether this task needs specialist craft beyond the Pack, such as visual composition, interaction design, UX flow, or product-decision elicitation. Check skills and plugins already available in the host. Use relevant installed capabilities according to the host's normal workflow; Taste does not rank them or require particular names.
3. If no suitable capability is already available, explain the gap and ask the user before searching the internet or installing anything. After search is approved, present relevant candidates and get approval for the chosen installation. The host performs discovery and installation; Taste supplies no shortlist and never installs silently. If the user declines, continue with the host's available capabilities and the Pack.
4. Try an approved capability on the current product task. Assess its usefulness on the artifact and workflow with the host's normal review. Keep trial results and feedback in the active host task; record useful operational learnings in the active task context.
5. Ask whether to keep a capability when the trial is complete. If the user wants to keep it, record its identity, version/source, and intended scope in a host-supported product or harness workflow location. The host owns that location and future activation. If no suitable persistent location exists, say the lock is session-only; do not put the catalog or lock in the Taste Pack.
6. When a meaningful UI tradeoff is unresolved, show concrete alternatives and explain their consequences. Ask a focused question about the outcome the user wants. Keep options and unresolved disagreement in the active task while designing. When the user rejects a direction or corrects the host, treat that as direct evidence, revise the work, and note the change and source in task context.
7. After resolving feedback, identify whether it expresses a clear reusable lesson. Use the format that best teaches the decision: a rule or checklist for a direct check, a decision tree for conditional choices, or an annotated exemplar for a judgment best shown in context. Record the trigger, scope, rationale, exceptions, and evidence. Separate observed precedent, inferred rationale, and explicitly settled decisions. Keep one-time reactions, private conversation details, and unresolved alternatives out of the Pack.
8. Self-check the implemented change with the host's available product workflow. If a usable Pack covers this surface, update the relevant guidance with `taste_pack_write`. If this surface is not covered, save a clear reusable lesson to the Pack; initialize a shell only if no Pack exists, replace the starter README and entry Skill, add a focused guidance file, and update the manifest with `setupStatus: usable_partial`, a one-surface `setupScope`, and matching `coverage` evidence/guidance references. Link new guidance from the entry Skill or its routing reference and include it in the matching manifest coverage. Use `source_reviewed` by default and label visual behavior unverified unless you actually rendered it. Validate the Pack. Do not sweep unrelated routes or apps. If the result is only task-specific or evidence is insufficient, keep it in the conversation. No separate approval is needed for the evidence-backed lesson.
9. Report the change and the guidance or Pack created/updated. The user can correct the lesson in the same conversation; update it after applying and self-checking the correction. Offer `/taste-setup` when broader product coverage would be useful.

Do not create a Taste-owned skill shortlist, catalog, ranking, benchmark, or skill lock. Formal comparison/benchmarking is deferred until a product workflow has user-approved locked capabilities and there is evidence to measure.

For UI copy, use targeted clarity edits and preserve facts, constraints, and product voice. A phrase list or scanner match alone is not evidence that copy is wrong and does not authorize a rewrite.

After a successful Pack update, report the guidance references updated.
