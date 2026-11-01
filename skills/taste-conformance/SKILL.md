---
name: taste-conformance
description: Apply accepted, validated, user-approved, shipped Taste while building or reviewing UI. Use when the user asks to match existing product taste, or when taste_part_state derives Conformance for that part. Always read the taste/ Pack first. If the current request introduces a new direction or the part is not Conformance, use taste-expression for that work.
---

# Conformance uses accepted shipped taste

Conformance is not a folder and not a global mode. It is using Decisions that are accepted, include matching host-reported validation and user-approval evidence, have shipped evidence, and have no coverage gap.

1. Check for `taste/`. If it is absent, there can be no Conformance evidence: route the task to `taste-expression` and keep the Pack absent until the host's relevant checks pass and the user approves the exact artifact and Decision. If present, call `taste_pack_inspect` and `taste_part_state`; read the entry Skill, shared facts, and the Decisions for this part.
2. Use a Decision for implementation only when `taste_part_state` derives Conformance. If the part is `no_decisions`, `proposed`, `rejected`, `accepted_not_shipped`, `promotion_evidence_missing`, `coverage_gap`, or `unparsed`, use `taste-expression` for that task. A user request for a new direction or correction also routes that task to Expression even when an older Decision remains Conformance. Other parts stay put.
3. Implement within the user's scope. Shipped UI is evidence of behavior, not permission to copy a known flaw. When the task goal and an accepted Decision conflict, say so and ask; do not silently rewrite the Pack.
4. Use the harness's source, browser, computer-use, and rendered-preview tools when the task needs visual or interaction evidence. Report the pages and states you actually viewed.
5. Report the Decisions used, checks run by the host, and any part handled through Expression. Do not record user feedback or update the Pack during iteration; follow `taste-expression` and promote only after the host reports checks and final user approval.

Do not call `taste_mode_resolve` to flip the Pack. A part becomes Conformance only through the recorded Decision fields, not through a mode switch.
