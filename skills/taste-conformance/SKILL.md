---
name: taste-conformance
description: Apply a product's sourced design guidance and task-and-surface checklists while building or reviewing UI. Use when the user asks to match existing product taste or when established guidance covers the part. Always read the taste/ Pack first; use Expression to resolve new directions and update checklists in an existing complete Pack from reusable user feedback.
---

# Conformance applies current product guidance

Conformance describes the task approach of applying established, sourced product guidance. It is not a folder or persistent mode. Route by the user's task and affected surface, then load relevant Pack guidance. Structured Decisions remain readable for legacy compatibility.

1. Check for `taste/`. If absent, do not initialize or sweep as a side effect of this UI task. Continue from repository evidence and tell the user `/taste-setup` is available when they explicitly want a Pack. If present, inspect it; if `setupStatus` is incomplete, do not present starter text as product guidance. Otherwise load only relevant Skills, references, and checklist entries. Read structured Decisions only when maintaining a legacy Pack; their derived state does not route checklist work.
2. Resolve the user's request mode and surface, then load only canonical references relevant to that pair. Use repository sources for component APIs, design-system rules, accessibility, and interaction contracts instead of duplicating them in the Pack.
3. Implement or review within the user's scope. Shipped UI is evidence, not automatic proof every pattern is intentional. Separate observed patterns from explicit product constraints and preserve uncertainty. If the user gives a correction that conflicts with an existing reference, apply the user's current direction and, for a complete Pack, revise the relevant checklist after self-checking when the lesson is reusable.
4. Use the harness's source, browser, computer-use, and rendered-preview tools when the task needs visual or interaction evidence. Report the pages and states you actually viewed.
5. When the user rejects a direction, corrects the result, or disagrees with a design choice, revise the work and self-check it. If the feedback expresses a reusable lesson and the Pack is complete, update the scoped checklist with `taste_pack_write` in the same task. No separate Decision promotion, Pack review, or user approval is required. Report checklist updates and remaining evidence gaps.

Do not call `taste_mode_resolve` or `taste_part_state` as the normal task router. Conformance is a host approach label for applying established guidance, not a status to persist or derive for each task.
