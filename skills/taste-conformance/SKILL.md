---
name: taste-conformance
description: Apply a product's sourced design guidance and task-and-surface checklists while building or reviewing UI. Use when the user asks to match existing product taste or when established guidance covers the part. Always read the taste/ Pack first; use Expression to resolve new directions and update checklists from user feedback.
---

# Conformance applies current product guidance

Conformance is not a folder and not a global mode. Apply the Pack's product-specific references and relevant checklist entries. Existing structured Decisions remain readable for compatibility, but routine checklist learning does not require a Decision promotion workflow.

1. Check for `taste/`. If absent but the product has existing UI, use `taste-setup` / `taste-sweep` to inventory the full product and create a tailored Pack after host self-review. For greenfield work, use transient `taste-expression` and initialize once there is reusable guidance to capture. If the Pack exists, call `taste_pack_inspect` and `taste_part_state` with required `taskIntent: apply_existing` and the affected `scope`. Read the entry Skill, shared facts, relevant surface references, and matching checklist entries regardless of whether structured Decision state derives Conformance.
2. Resolve the user's request mode and surface, then load only canonical references relevant to that pair. Use repository sources for component APIs, design-system rules, accessibility, and interaction contracts instead of duplicating them in the Pack.
3. Implement or review within the user's scope. Shipped UI is evidence, not automatic proof every pattern is intentional. Separate observed patterns from explicit product constraints and preserve uncertainty. If the user gives a correction that conflicts with an existing reference, apply the user's current direction and revise the relevant checklist after self-checking.
4. Use the harness's source, browser, computer-use, and rendered-preview tools when the task needs visual or interaction evidence. Report the pages and states you actually viewed.
5. When the user rejects a direction, corrects the result, or disagrees with a design choice, revise the work and self-check it. If the feedback expresses a reusable lesson, update the scoped checklist with `taste_pack_write` in the same task. No separate Decision promotion, Pack review, or user approval is required. Report checklist updates and remaining evidence gaps.

Do not call `taste_mode_resolve` to flip the Pack. A part becomes Conformance only through the recorded Decision fields, not through a mode switch.
