---
name: taste-conformance
description: Implement or review product UI/UX work against accepted, evidence-backed product direction. Use when the user explicitly asks to conform to existing product taste or the product Skill identifies established direction as the task mode.
---

# Conformance workflow

1. Read the target repository's product-design entry Skill and follow its product-specific triggers. The coding agent interprets user intent and product context; do not classify mode from keywords alone.
2. If the task router has not already done so, resolve the interpreted signal with `taste_mode_resolve`. Load shared product facts and only the relevant Conformance references. If the Pack has only proposed or weakly supported guidance for a consequential choice, surface the gap rather than treating it as policy.
3. Implement within the user's requested scope. Use the harness's source, browser, computer-use, and rendered-preview tools when the task requires visual or interaction evidence. Check relevant pages/states and report what was actually viewed.
4. Run only applicable deterministic Gates; keep product judgments with the coding agent and review. Report mode, references and evidence used, checks performed, and unresolved gaps.

For deliberate new-direction work, use `taste-expression`; do not force an exploratory request into Conformance.
