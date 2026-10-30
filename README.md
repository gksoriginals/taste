# Taste

Taste is a portable product-design plugin for existing coding harnesses. It provides Skills, a local MCP server, and TypeScript tools that help the host coding agent learn and apply product-specific design guidance stored in a target repository's `taste/` Pack.

Taste does not configure or host the coding agent. Codex and Cursor use the portable [Agent Plugins](https://agent-plugins.org/) package at this repository root. Claude Code uses the same Skills and server through its native plugin compatibility files.

## Quick start

Requirements: Node.js 20 or later.

```sh
npm install
npm run build
npm test
```

For local development, the Codex repo marketplace is declared under `.agents/plugins/marketplace.json`; Cursor loads the portable root Agent Plugin; Claude Code can load it with `claude --plugin-dir .` from the repository root. See [docs/plugin-development.md](docs/plugin-development.md) for harness setup and smoke checks.

## Docs

- [docs/prd.md](docs/prd.md) — PRD mirror of the product one-pager
- [docs/engineering.md](docs/engineering.md) — system design
- [docs/implementation-plan.md](docs/implementation-plan.md) — v1 milestones, scope, and acceptance status
- [docs/plugin-development.md](docs/plugin-development.md) — local plugin setup and test workflow
- [docs/plugin-workflows.md](docs/plugin-workflows.md) — named Taste workflows and activation triggers
- [docs/validation-results.md](docs/validation-results.md) — synthetic end-to-end evaluation smoke run and its limits
- [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) — product source of truth

Read [agent.md](agent.md) before changing project conventions.
