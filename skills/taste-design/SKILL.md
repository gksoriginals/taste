---
name: taste-design
description: Use for any UI, UX, screen, component, layout, or frontend design task when Taste is installed. Always load the product repository's taste/ Pack before designing. Follow Conformance only where taste_part_state says the Decision is accepted, shipped, and not a coverage gap; otherwise use taste-expression for that part. If no Pack exists, use taste-setup instead of inventing taste.
---

# Design with the Pack

The coding harness owns the loop. Taste does not start an agent. Do not design product UI from memory when a Pack can be loaded.

1. Resolve the product repository path from the harness. Call `taste_pack_inspect`. If there is no Pack, stop and follow `taste-setup`. Do not invent taste to fill the gap.
2. Call `taste_part_state`. Read `skills/product-design/SKILL.md`, `references/shared/product-facts.md`, and every Decision under `references/decisions/` that touches the task. On a legacy Pack with split folders, read those references too, and still treat only structured Decisions as derived Conformance.
3. Choose the path per part, not for the whole Pack:
   - **Conformance** only when `taste_part_state` confirms accepted status, matching host-reported validation and user-approval evidence, shipped evidence, and `coverage_gap: false`. Follow `taste-conformance` and use those Decisions.
   - **Expression** when the user asks for new taste, the part has no supported Decision, the current task introduces a new direction or correction, or `taste_part_state` derives Expression. Follow `taste-expression`; keep iteration feedback in the host task and write no Decision until the final tested artifact and Decision are approved.
4. Implement or review only the requested scope. Use the harness browser, computer-use, or rendered preview when visual evidence matters. Run only mechanical checks that already exist in the product repo.
5. When the user likes an early direction, continue the host's own workflow and nudge the host to finish implementation, relevant checks, and final user approval. Read `decisionPromotionCheckpoint` from the Pack manifest if configured; it guides when to call Taste but does not define or run host checks. Record only the exact tested artifact and Decision the user approved.
6. Report which Decisions you loaded, the derived activity per part, what you inspected, what host-reported evidence was recorded, and any remaining Expression work.

`taste_mode_resolve` is a deprecated helper. It does not read the Pack and it does not decide who initiates Expression. Prefer `taste_part_state` plus the user's request.
