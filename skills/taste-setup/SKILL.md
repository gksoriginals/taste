---
name: taste-setup
description: Set up Taste for a product repository, create its Pack and product-specific mode Skill, and establish an evidence-backed first surface. Use when the user explicitly asks to install, initialize, or prepare Taste for a product.
---

# Set up Taste for a product

The existing harness coding agent performs setup. Taste is already the installed plugin; do not configure or host another agent.

1. Identify the target product repository and inspect whether `taste/` already exists. If it does, inspect and continue it; never overwrite it. If absent, initialize only in response to this setup request.
2. Ask which first product surface to capture when the repository and product context do not make it clear. Prefer a surface with repeated decisions and useful shipped examples, not the broadest possible sweep.
3. Explain the evidence needed. A Conformance-ready first surface requires inspection of the running product with the harness's available browser or computer-use tools: open relevant product pages, follow the important user flow, inspect visible states and interactions, and capture screenshots. Also inspect relevant source and, where available, Git history and reviews. Record what was actually inspected, URLs or screenshot paths, date/viewport, observations, inferences, known flaws, and gaps. Ask the user/harness for access or screenshots if those tools or product environments are unavailable; do not report a code-only pass as a complete visual sweep.
4. Build both Conformance and Expression routes in the product entry Skill before declaring setup ready. Ground Conformance guidance in observed product evidence. Ask the user through the harness whether they want to establish Expression intent during setup; if yes, use `taste-expression` and ask only context-relevant questions. If they defer or have no new direction, keep the Expression route available but label its product direction unestablished; do not invent one to fill the Pack.
5. Draft mode triggers, focused product guidance, and nearby examples. Separate observed facts, inferred rules, proposed guidance, accepted decisions, known flaws, and evidence gaps. Ask the product owner to review candidates before treating them as accepted product-wide guidance.
6. Validate the Pack and summarize what is ready, proposed, missing, and which harness tools or permissions would complete the survey.

Use `taste_pack_initialize`, `taste_pack_inspect`, `taste_pack_write`, and `taste_pack_validate` when available. Keep ephemeral notes and private captures in the harness/plugin's working store; put reviewed product guidance and shareable source references in the target repository's `taste/` Pack.
