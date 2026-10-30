---
name: taste-design
description: Use for UI/UX implementation or review when the Taste plugin is installed. Apply the repository's Taste Pack when present; if absent, offer setup instead of inventing product guidance.
---

# Apply product taste

Use the existing coding harness and its coding agent. Taste does not start or configure an agent.

1. Locate and inspect the repository's `taste/` Pack. Load the product-design entry Skill and only task-relevant references.
2. Interpret the request using the product's triggers, then call `taste_mode_resolve` with that structured signal. The tool resolves the signal deterministically; it does not inspect raw language. Ask through the harness if intent is unclear or a direction needs user acceptance.
3. For Conformance, follow `taste-conformance`; for Expression, follow `taste-expression`. Load shared product facts and only the selected mode's relevant references. Treat shipped work as evidence, not permission to copy known flaws. Honor the explicit task goal and surface conflicts with accepted Pack guidance.
4. Implement or review within scope. Use the harness's browser, computer-use, and rendered-preview tools when visual or interaction evidence matters. Invoke only applicable mechanical Gates.
5. Report the active mode and rationale, guidance and evidence used, rendered states actually inspected, checks performed, and unresolved product questions.

If no Pack exists, do not invent product taste. Offer `taste-setup`; for evidence gathering use `taste-sweep`, for new direction use `taste-expression`, and for controlled comparisons use `taste-evaluate`.
