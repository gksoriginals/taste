# Taste

From what's shipped, extract a product's taste so any coding harness, given a PRD and the Taste pack, first-passes UI you'd merge.

**Status:** Draft · Oct 2026

## What it is

A plugin for an existing coding-agent harness (Cursor, Claude Code, Codex, and others). The harness keeps the loop. Taste is the Pack in the target product repo, the MCP tools the harness calls, and the skills that build and maintain the Pack. For now, Gopi is dogfooding it; it is built for software-product UI projects generally.

## What it isn't

- Not an agent runtime. The harness owns the loop, planning, and the model; Taste supplies context, tools, and checks.
- Not a component library, and it won't become a design system product.

## Docs

- [docs/prd.md](docs/prd.md) — PRD mirror of the one-pager
- [docs/engineering.md](docs/engineering.md) — product architecture (draft): harness plugin, Conformance and Expression in parallel, L0–L4 stack, domain model
- [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) — Google Doc, source of truth

Cursor and Grok Bot: read [agent.md](agent.md) before changing this repo.
