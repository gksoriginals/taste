# Repository guidance

This repository contains the Taste plugin. The product brief is in [docs/prd.md](docs/prd.md); implementation details are in [docs/engineering.md](docs/engineering.md). Follow those documents and the current code. Do not treat old milestone plans or generated examples as current product behavior.

Taste is a plugin for existing coding assistants. The host owns conversation, repository and UI inspection, design judgment, implementation, checks, self-review, and delegation. Taste provides workflow Skills and a local MCP server for Pack and evaluation operations.

Product Packs live in a target product repository's `taste/` directory. There is one product-specific Pack per repository, with only the Skills, references, checklists, metadata, and evaluation material supported by that product's needs and evidence. Do not impose a universal Pack taxonomy.

For UI tasks, route from the request and affected surface. Apply existing relevant guidance (Conformance), explore a new direction or resolve a correction (Expression), or ask a focused question if a material ambiguity remains. These are task approaches, not persisted Pack modes.

Use explicit `/taste-setup` or the `taste-setup` Skill for a bounded repository-wide setup or refresh. Ordinary UI work must not start a broad sweep. A clear, resolved, reusable user correction may be applied, self-checked, and written as a scoped checklist lesson during the task; if needed, create a minimal Pack for only that surface. Keep one-off or unresolved feedback in the conversation. Do not require separate approval or promotion for this checklist-learning path.


Keep documentation aligned with shipped code. Clearly label unverified capabilities and evaluation limits; practitioner articles are design references, not proof of effectiveness.
