# Agent notes

Collaboration notes for Cursor and Grok Bot in this repo.

## Product

Taste is a product: a plugin for an existing coding-agent harness (Cursor, Claude Code, Codex, and others). The harness keeps the loop, planning, models, and edit and shell tools. Taste supplies the Pack in the target product repo, MCP tools, pack-maintainer skills (Sweep, Learn, Interview), gates as linters or CI, and a Critic brief the harness runs as a subagent. From what's shipped, a harness given a PRD and the Taste Pack should first-pass UI you'd merge.

## Source of truth

- Product: the [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) is the source of truth. [docs/prd.md](docs/prd.md) mirrors it. If they diverge, the Doc wins. Do not invent product locks beyond the Doc.
- Engineering: [docs/engineering.md](docs/engineering.md) is the product architecture: the system diagram, the L0–L4 abstraction stack, the domain model, and the harness integration. It is a draft (v0), not a final lock. More research may refine it. Schemas in that doc are documentation, not implemented code. If it and the Doc disagree about the product, the Doc wins. Do not invent engineering locks beyond that doc.
- North owns product discussion.
- Dev owns engineering, the repo, and coding.

## Working rules

- The harness owns the loop and runtime (planning and model included). Taste supplies context, tools, checks, pack-maintainer skills, and a Critic subagent brief. Taste does not host its own runtime.
- Taste is a Pack, MCP tools, and harness skills. It is not a design system, and it is not a component library.
- Shipped wins over stated preferences. When they conflict, what's shipped is the source of truth.
- Conformance and Expression are lifecycle states of a part of one Pack, not two artefact sets. From scratch is Expression. Defined, agreed, and shipped is Conformance. When the artefacts cannot justify the next step, that part returns to Expression. Otherwise Conformance keeps looping. The Pack never flips. Ally and a greenfield surface such as omnipresent are parallel dogfoods of that one shape. Who initiates a mode change, a human or the harness, stays open in the one-pager. Do not invent it.
- Critic is a harness subagent: a review pass on a bigger model, with a Pack brief. Critique reviews generator output (generate–review). The GAN metaphor is historical only. The protocol may change.
- v0 baseline is LangChain Content Studio and Anthropic frontend-skills, with Vercel, OpenAI, and Emil folded in by [docs/engineering.md](docs/engineering.md). Follow that doc. The architecture is still a draft. More research may refine it before it is locked.

This repo is docs only. Do not add application code, a package manifest, an MCP server, or a skill tree. Schemas, MCP tool names, and skill roles in the engineering doc are documentation, not code to implement here. The Vercel tree in that doc is the default Pack adapter for target product repos. Do not add a skill tree here.
