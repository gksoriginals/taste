# Agent notes

Collaboration notes for Cursor and Grok Bot in this repo.

## Product

Taste is a plugin for existing coding harnesses: it provides a portable product Pack, Skills, and tools (including an MCP server) that the harness's coding agent uses to build and maintain the Pack and apply its guidance. Taste does not configure or run an agent. From what's shipped, a harness given a PRD and the Taste Pack should first-pass UI you'd merge.

## Source of truth

- Product: the [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) is the source of truth. [docs/prd.md](docs/prd.md) mirrors it. If they diverge, the Doc wins. Do not invent product locks beyond the Doc.
- Engineering: [docs/engineering.md](docs/engineering.md) uses LangChain Content Studio's knowledge layers and Anthropic's on-demand Skills as the organizing starting point, with Vercel's in-repo conformance Pack, Gates, review, and evals as implementation references; OpenAI and Emil add frontend-guidance patterns. These sources describe work in their own contexts. Taste's combined architecture and boundaries remain hypotheses, not implementation requirements. If it and the Doc disagree about the product, the Doc wins.
- North owns product discussion.
- Dev owns engineering, the repo, and coding.

## Working rules

- The harness owns the loop and runtime (planning and model included). Taste supplies context, tools, and checks. Taste is not an agent runtime.
- Taste is a portable Pack plus a harness plugin that provides Skills and tools, including an MCP server. The existing harness coding agent performs its agent roles; the harness may delegate Eval Judge work to a higher-capacity subagent. Taste does not configure or host agents. Taste is not a design system or a component library.
- For conformance, shipped work is evidence of current product behavior, not automatic approval of its flaws. A stated preference that conflicts with shipped behavior is not an accepted product rule; the user's explicit task goal remains the immediate authority.
- Conformance on HelloAlly ally-platform first. Expression on omnipresent later.
- Critique is a review responsibility performed by the existing harness coding agent; the harness may delegate it using its own subagent feature. Taste supplies Skills and tools, not configured agents. The GAN metaphor is historical only, and the protocol is open.
- LangChain Content Studio and Anthropic's on-demand Skills inform the knowledge-layer architecture. Keep a target product's portable, versioned Pack under its `taste/` directory, with shared and mode-specific guidance for Conformance and Expression. Use Vercel's in-repo `product-design` pattern for the entry Skill, focused references, evidence review, Gates, and evals, but do not copy its full directory tree by default. The product's entry Skill defines how the coding agent selects and switches modes from user intent and product context; ask through the harness when intent is ambiguous. Keep examples and known flaws beside their related guidance; add indexes or collections only when the Pack needs them. Keep transient/private working memory in harness or plugin storage and promote reviewed product-wide knowledge into `taste/`. A root `AGENTS.md` may be a thin discovery/setup hint for harnesses that read it; it is neither the Taste integration nor a universal installer. The Taste plugin supplies reusable Skills and tools; each harness's integration registers them through its supported mechanism. After setup, it should load the existing `taste/` Pack. OpenAI and Emil inform frontend guidance, especially the later Expression path. See [docs/engineering.md](docs/engineering.md).

This repository now contains the TypeScript Taste plugin and its docs. The portable Agent Plugins package at the repository root is canonical for Codex and Cursor; `.claude-plugin/` and `.mcp.json` provide Claude Code compatibility. Keep product-specific Taste Packs in target repositories (the example Pack lives under `examples/`), not at this repository's root. Taste Skills guide the existing harness coding agent; do not add configured or hosted agents. Keep semantic decisions in Skills and narrow deterministic behavior in `src/core/` and tools. The plugin structure remains revisable as end-to-end use reveals whether it serves the product intent.
