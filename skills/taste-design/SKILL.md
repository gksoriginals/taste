---
name: taste-design
description: Use when creating, implementing, reviewing, or improving product UI and a repository contains a Taste Pack, or when the user asks to apply product-specific design guidance.
---

# Apply product taste

Use the existing coding harness and its coding agent. Taste does not start or configure an agent.

1. Locate the repository's `taste/` Pack. Use the Taste MCP tools to inspect it and load the product-design entry Skill and only the references relevant to the task. If tools are unavailable, read those files with the harness's repository tools.
2. Follow the product's entry Skill to choose Conformance or Expression. Conformance follows supported decisions in shipped work; Expression develops an intentionally new or extended direction. Interpret user intent and product context rather than relying on a hard-coded classifier. Ask the user through the harness when the choice materially changes the work and remains unclear.
3. Use shared product facts and mode-specific guidance. Treat shipped work as evidence, not permission to copy known flaws. Honor the user's explicit task goal and surface conflicts with accepted Pack guidance.
4. Implement or review within the requested scope. Use repository tools for source, browser, and rendered evidence. Invoke mechanical Gates only when the Pack or repository provides them; explain findings in context.
5. Report the active mode, guidance used, evidence checked, and unresolved product questions when they affect the result.

If no Pack exists, do not invent the product's taste. Tell the user and offer to create a starter Pack with the `taste-pack` Skill. For Pack upkeep use `taste-pack`; for controlled comparisons use `taste-evaluate`.
