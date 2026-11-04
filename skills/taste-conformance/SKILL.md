---
name: taste-conformance
description: Apply a product's sourced design guidance and task-and-surface checklists while building or reviewing UI. Use when the user asks to match existing product taste or when established guidance covers the part. Always read the taste/ Pack first; use Expression for new directions and save clear reusable user feedback to a covered checklist or a minimal surface-scoped Pack.
---

# Conformance applies current product guidance

Conformance describes the task approach of applying established, sourced product guidance. It is not a folder or persistent mode. Route by the user's task and affected surface, then load relevant Pack guidance.

1. Check for `taste/`. If absent, continue from repository evidence without starting a product-wide sweep. A correction that resolves into a clear reusable lesson can create a minimal Pack for the affected surface through `taste-expression`. If present, inspect it; if `setupStatus` is `in_progress`, do not present starter text as product guidance. For `usable_partial`, load guidance only for listed supported coverage; otherwise load only relevant Skills, references, and checklist entries.
2. Resolve the user's request mode and surface, then load only canonical references relevant to that pair. Use repository sources for component APIs, design-system rules, accessibility, and interaction contracts instead of duplicating them in the Pack.
3. Implement or review within the user's scope. Shipped UI is evidence, not automatic proof every pattern is intentional. Separate observed patterns from explicit product constraints and preserve uncertainty. If the user gives a correction that conflicts with an existing reference, apply the current direction and revise the relevant checklist—or create a minimal Pack for this surface—after self-checking when the lesson is reusable.
4. Use the harness's source, browser, computer-use, and rendered-preview tools when the task needs visual or interaction evidence. Report the pages and states you actually viewed.
5. When the user rejects a direction, corrects the result, or disagrees with a design choice, revise the work and self-check it. If the feedback expresses a reusable lesson, update the covered checklist or create a minimal Pack for that surface through `taste-expression`. No product-wide sweep, separate promotion workflow, or additional approval is required. Report checklist updates and remaining evidence gaps.

Conformance is a host approach label for applying established guidance, not a status to persist or derive for each task.
