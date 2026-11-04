---
name: taste-design
description: Use for any UI, UX, screen, component, layout, or frontend design task when Taste is installed. Load the existing product Pack and relevant guidance; never create or refresh setup during routine UI work.
---

# Design with the Pack

The coding harness owns the loop. Taste does not start an agent. Do not design product UI from memory when a Pack can be loaded.

1. Resolve the repository path and check for `<repo>/taste/`. If a Pack exists, inspect it and load only guidance relevant to this scope; apply `usable_partial` guidance only to its listed evidence-backed coverage. Route from the current task and surface. If setup is `in_progress`, do not use starter boilerplate as product guidance; continue the requested task using repository evidence and offer `/taste-setup` to resume.
2. If no Pack exists, do not start a product-wide sweep as a side effect of this UI request. Continue the requested work from repository evidence and available host capabilities. If feedback resolves into a clear, reusable lesson for the affected surface, use `taste-expression` to create a minimal, evidence-backed Pack for that surface. Use `/taste-setup` when the user wants a broader product sweep. A new direction, correction, or greenfield surface is Expression work and can proceed without a prior Pack.
3. Choose the path per part, not for the whole Pack:
   - Apply existing product guidance for the relevant scope.
   - Use **Expression** for a new direction, correction, gap, or greenfield task. Apply relevant existing guidance while exploring.
   - If a Pack covers the affected surface and user feedback resolves into a clear reusable lesson, update the relevant guidance after applying it and self-checking the result. If the surface is not covered, add the lesson and its evidence as `usable_partial` coverage; initialize a minimal Pack only when none exists. This is routine learning, not a product-wide setup. Keep one-off or unresolved feedback in the conversation.
4. For Expression work that needs specialist visual, interaction, UX-flow, or product-decision craft beyond the Pack, follow `taste-expression`'s detect → ask-install → try → lock steps. The host discovers candidates and owns any approved installs and persistent locks; Taste has no required skill names, shortlist, or catalog.
5. Implement only when implementation is requested. For a review, report findings without editing unless the user separately asks for changes. Use the harness browser, computer-use, or rendered preview when visual evidence matters. Run only mechanical checks that already exist in the product repo.
6. Treat corrections, rejections, and disagreements in the live conversation as direct feedback. Revise only the requested UI scope, then self-check. Update scoped Pack guidance or create a minimal surface-scoped Pack when the lesson is clear, reusable, and supported by the changed artifact or product evidence. Do not use feedback as a reason to sweep unrelated surfaces.
7. If the user corrects existing guidance, apply the correction and update it as part of the same task. If the affected surface is uncovered, create narrow guidance for it after the lesson is clear. Do not ask for separate Pack-write approval. Keep one-off or unresolved preferences in the task context.
8. Report the guidance loaded or updated, what you actually inspected, and any remaining gaps. If the task produced a usable partial Pack, state which surface it covers; offer `/taste-setup` for broader coverage.

## Session traces

When the Taste server reports that local tracing is enabled, generate a random UUID at the start of the task and pass it as `runId` on Taste MCP calls. Note the starting revision and any relevant changes already in the working tree. At the end, call `taste_session_record` with a short task and surface summary, guidance actually read and applied (including direct file reads), the decision and its reason, verification evidence, artifact references, and explicit user feedback if available. Use `pending` when feedback is unavailable. If feedback arrives later in the same task, save another snapshot with the same run ID. Use short summaries and artifact references. Exclude secrets, personal data, and raw conversations. If tracing fails, report the gap and finish the product task.
