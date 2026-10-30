---
name: product-design
description: Apply Example Product's design direction when implementing or reviewing its account setup experience.
---

# Example Product design

This example is synthetic. Its conventions demonstrate organization only; they are not reusable prescriptions.

## Choose and switch the task mode

- Use **Conformance** when the requested change follows accepted product direction. Consider the current product UI and interaction states, source, and accepted decisions; do not equate an observed pattern with an approved rule.
- Use **Expression** when the user asks to explore, establish, or intentionally change direction. Ask the user questions through the harness, based on the decisions still open; do not turn assumptions into product intent.
- For mixed or unclear intent, ask one focused question through the harness before the choice changes the work. Honor an explicit user mode request.
- Use `taste_mode_resolve` with the product Skill's interpreted signal. A selected mode is task-local. Transition Expression to Conformance only after the user confirms the proposed direction as accepted product guidance.

Read shared product facts, then only the relevant mode references. A visual Conformance sweep requires rendered product evidence: inspect relevant pages and flow states with available browser/computer tools and capture screenshots. Treat shipped work as evidence, not as an automatic rule; note known flaws and uncertainty.

## Shared and mode-specific guidance

- [Shared product facts](references/shared/product-facts.md)
- [Conformance: account setup](references/conformance/account-setup.md)
- [Expression: account setup](references/expression/account-setup.md)
