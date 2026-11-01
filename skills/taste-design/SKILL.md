---
name: taste-design
description: Use for any UI, UX, screen, component, layout, or frontend design task when Taste is installed. Always load the product repository's taste/ Pack before designing. Follow Conformance only where taste_part_state says the Decision is accepted, shipped, and not a coverage gap; otherwise use taste-expression for that part. If no Pack exists, use taste-setup instead of inventing taste.
---

# Design with the Pack

The coding harness owns the loop. Taste does not start an agent. Do not design product UI from memory when a Pack can be loaded.

1. Resolve the product repository path from the harness. Call `taste_pack_inspect`. If there is no Pack, stop and follow `taste-setup`. Do not invent taste to fill the gap.
2. Call `taste_part_state`. Read `skills/product-design/SKILL.md`, `references/shared/product-facts.md`, and every Decision under `references/decisions/` that touches the task. On a legacy Pack with split folders, read those references too, and still treat only structured Decisions as derived Conformance.
3. Choose the path per part, not for the whole Pack:
   - **Conformance** for a part whose Decisions are accepted, have shipped evidence, and have `coverage_gap: false`. Follow `taste-conformance` and use those Decisions.
   - **Expression** when the user asks for new taste, the part has no Decision, or `taste_part_state` derives Expression. Follow `taste-expression` and persist with `taste_record_signal` before implementation that depends on the new judgment.
4. Implement or review only the requested scope. Use the harness browser, computer-use, or rendered preview when visual evidence matters. Run only mechanical checks that already exist in the product repo.
5. Report which Decisions you loaded, the derived activity per part, what you inspected, and any signal you wrote.

`taste_mode_resolve` is a deprecated helper. It does not read the Pack and it does not decide who initiates Expression. Prefer `taste_part_state` plus the user's request.
