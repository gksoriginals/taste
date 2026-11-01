---
name: taste-conformance
description: Apply accepted shipped Taste while building or reviewing UI. Use when the user asks to match existing product taste, or when taste_part_state derives Conformance for that part (accepted Decision, shipped evidence, no coverage gap). Always read the taste/ Pack first. If the part is not Conformance, hand that part to taste-expression instead of pretending the Pack justifies it.
---

# Conformance uses accepted shipped taste

Conformance is not a folder and not a global mode. It is using Decisions that are accepted, have shipped evidence, and have no coverage gap.

1. Call `taste_pack_inspect` and `taste_part_state`. Read the entry Skill, shared facts, and the Decisions for this part. If the Pack is missing, follow `taste-setup`.
2. Use a Decision for implementation only when its derived activity is Conformance. If the part is `no_decisions`, `proposed`, `rejected`, `accepted_not_shipped`, `coverage_gap`, or `unparsed`, stop treating it as Conformance and follow `taste-expression` for that part. Other parts stay put.
3. Implement within the user's scope. Shipped UI is evidence of behavior, not permission to copy a known flaw. When the task goal and an accepted Decision conflict, say so and ask; do not silently rewrite the Pack.
4. Use the harness's source, browser, computer-use, and rendered-preview tools when the task needs visual or interaction evidence. Report the pages and states you actually viewed.
5. Report the Decisions used, checks run, and any part handed to Expression.

Do not call `taste_mode_resolve` to flip the Pack. A part becomes Conformance only through the recorded Decision fields, not through a mode switch.
