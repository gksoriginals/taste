---
name: taste-design
description: Use for any UI, UX, screen, component, layout, or frontend design task when Taste is installed. Load the existing product Pack and relevant guidance; never create or refresh setup during routine UI work.
---

# Design with the Pack

The coding harness owns the loop. Taste does not start an agent. Do not design product UI from memory when a Pack can be loaded.

1. Resolve the repository path and check for `<repo>/taste/`. If a Pack exists, inspect it and load only guidance relevant to this scope; apply `usable_partial` guidance only to its listed evidence-backed coverage. Route normally from the current task and surface; use `taste_part_state` only when inspecting or diagnosing legacy structured Decision records. It is not the checklist-routing authority. If setup is `in_progress`, do not use starter boilerplate as product guidance; continue the requested task using repository evidence and offer `/taste-setup` to resume. On legacy Packs, read their existing guidance.
2. If no Pack exists, do not initialize one or start a sweep as a side effect of this UI request. Continue the requested work from repository evidence and available host capabilities, keep new guidance in the active task, and tell the user they can run `/taste-setup` when they want a repository Pack. A user-requested new direction, correction, or greenfield product/surface is Expression work and can proceed without setup.
3. Choose the path per part, not for the whole Pack:
   - Apply existing product guidance for the relevant scope.
   - Use **Expression** for a new direction, correction, gap, or greenfield task. Apply relevant existing guidance while exploring.
   - If an existing, complete Pack is present and user feedback resolves into a clear reusable lesson, update the relevant checklist after applying it and self-checking the result. This is routine learning, not setup. Keep one-off or unresolved feedback in the conversation. If no Pack exists, keep learning transient until the user explicitly invokes `/taste-setup`.
4. For Expression work that needs specialist visual, interaction, UX-flow, or product-decision craft beyond the Pack, follow `taste-expression`'s detect → ask-install → try → lock steps. The host discovers candidates and owns any approved installs and persistent locks; Taste has no required skill names, shortlist, or catalog.
5. Implement only when implementation is requested. For a review, report findings without editing unless the user separately asks for changes. Use the harness browser, computer-use, or rendered preview when visual evidence matters. Run only mechanical checks that already exist in the product repo.
6. Treat corrections, rejections, and disagreements in the live conversation as direct feedback. Revise only the requested UI scope, then self-check. For an existing, complete Pack, update its relevant checklist using `taste_pack_write` when the lesson is clear and reusable. Do not create setup or Pack scaffolding during a normal UI task.
7. If the user corrects a checklist entry in an existing complete Pack, apply the correction and update it as part of the same task. Do not ask for separate Pack-write or Decision-text approval. Keep one-off or unresolved preferences in the task context.
8. Report the guidance and checklist entries loaded or updated, what you actually inspected, and any remaining gaps. If no completed Pack exists, say so and offer `/taste-setup`; complete the requested UI task without writing setup files.

`taste_part_state` is a legacy compatibility/diagnostic tool for structured Decision records. Do not call it to route normal checklist-based UI tasks. The host uses the task request and affected surface. `taste_mode_resolve` is deprecated.
