---
name: taste-design
description: Use for any UI, UX, screen, component, layout, or frontend design task when Taste is installed. Load an existing product Pack before designing. If no Pack exists, first determine whether the requested part already has shipped UI: sweep existing UX into approved Decisions, or use transient Expression for new UI.
---

# Design with the Pack

The coding harness owns the loop. Taste does not start an agent. Do not design product UI from memory when a Pack can be loaded.

1. Resolve the product repository path from the harness and check whether `<repo>/taste/` exists. If it exists, call `taste_pack_inspect` and `taste_part_state` with a required `taskIntent` and affected `scope`: use `apply_existing` when following established guidance; use `new_direction`, `correction`, `gap`, `greenfield`, or `unclear` for the corresponding request. Read `skills/product-design/SKILL.md`, shared product facts, and relevant Decisions. On a legacy Pack with split folders, read those references too.
2. If no Pack exists, determine whether the requested part already has a usable existing UI. For an existing product or surface, follow `taste-sweep` to inspect the shipped UX and capture candidate judgments. For a genuinely greenfield surface, follow `taste-expression` and keep user input and iteration in the active host task. Do not create an empty Pack merely to start either workflow.
3. Choose the path per part, not for the whole Pack:
   - **Conformance** only when durable state in `taste_part_state` confirms accepted status, matching host-reported validation and user-approval evidence, shipped evidence, and `coverage_gap: false`, and `taskRouting` is absent. Follow `taste-conformance` and use those Decisions.
   - **Expression** when `taste_part_state.taskRouting` says Expression, the Pack is absent or has no supported Decision, or durable state derives Expression. A supplied `taskIntent` makes this routing explicit while leaving persisted Pack state unchanged. With an absent Pack, this is transient task routing: use `taste-sweep` for existing UX and `taste-expression` for greenfield or changed UX.
4. For Expression work that needs specialist visual, interaction, UX-flow, or product-decision craft beyond the Pack, follow `taste-expression`'s detect → ask-install → try → lock steps. The host discovers candidates and owns any approved installs and persistent locks; Taste has no required skill names, shortlist, or catalog.
5. Implement or review only the requested scope. Use the harness browser, computer-use, or rendered preview when visual evidence matters. Run only mechanical checks that already exist in the product repo.
6. When the user likes an early direction, nudge the host to continue implementation, relevant checks, and final user approval. This reaction is not approval of the tested artifact and does not create a Pack.
7. For an existing UX sweep, after the host reports its applicable inspection/validation evidence and the user approves the exact inspected shipped artifact and candidate judgment, initialize a missing Pack and call `taste_record_signal` automatically; include shipped evidence because the shipped UI was actually inspected. For implementation or greenfield Expression, wait until relevant checks pass and the user approves the exact tested artifact, then derive the reusable Decision and record it. In either path, do not ask separately to update the Pack or approve Decision wording. If an existing Pack has `decisionPromotionCheckpoint`, it guides when the host invokes Taste; it does not define or run host checks.
8. Report which Decisions you loaded, the derived activity per part, what you inspected, what host-reported evidence was recorded, and any remaining Expression work.

`taste_mode_resolve` is a deprecated helper. It does not read the Pack and it does not decide who initiates Expression. Pass the host-interpreted current request as `taskIntent` to `taste_part_state`; that tool returns the task-local Expression route alongside unchanged Pack-derived state. The tool cannot parse raw conversation text itself.
