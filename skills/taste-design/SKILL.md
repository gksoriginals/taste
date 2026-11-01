---
name: taste-design
description: Use for any UI, UX, screen, component, layout, or frontend design task when Taste is installed. Load an existing product Pack before designing. If no Pack exists, route to Expression and keep exploration transient; initialize only after the user approves the tested artifact and Decision.
---

# Design with the Pack

The coding harness owns the loop. Taste does not start an agent. Do not design product UI from memory when a Pack can be loaded.

1. Resolve the product repository path from the harness and check whether `<repo>/taste/` exists. If it exists, call `taste_pack_inspect` and `taste_part_state`; read `skills/product-design/SKILL.md`, shared product facts, and relevant Decisions. On a legacy Pack with split folders, read those references too.
2. If no Pack exists, do not initialize it merely to start a UI task. Treat the part as Expression, keep user input and iteration in the active host task, and proceed without durable Taste files.
3. Choose the path per part, not for the whole Pack:
   - **Conformance** only when an existing `taste_part_state` confirms accepted status, matching host-reported validation and user-approval evidence, shipped evidence, and `coverage_gap: false`. Follow `taste-conformance` and use those Decisions.
   - **Expression** when the user asks for new taste, the Pack is absent or has no supported Decision, the current task introduces a new direction or correction, or `taste_part_state` derives Expression. Follow `taste-expression`; keep iteration feedback in the host task.
4. Implement or review only the requested scope. Use the harness browser, computer-use, or rendered preview when visual evidence matters. Run only mechanical checks that already exist in the product repo.
5. When the user likes an early direction, nudge the host to continue implementation, relevant checks, and final user approval. This reaction is not approval of the tested artifact and does not create a Pack.
6. After the host reports its relevant checks passed and the user approves both the exact tested artifact and Decision, initialize a Pack if absent, then call `taste_record_signal`. If an existing Pack has `decisionPromotionCheckpoint`, it guides when the host invokes Taste; it does not define or run host checks.
7. Report which Decisions you loaded, the derived activity per part, what you inspected, what host-reported evidence was recorded, and any remaining Expression work.

`taste_mode_resolve` is a deprecated helper. It does not read the Pack and it does not decide who initiates Expression. Prefer `taste_part_state` plus the user's request.
