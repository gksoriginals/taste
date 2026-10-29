# Agent notes

Collaboration notes for Cursor and Grok Bot in this repo.

## Product

Taste is a portable design-taste layer for coding agents: a pack in the repo, an MCP server, and agents that build and maintain the pack. From what's shipped, a harness given a PRD and the Taste pack should first-pass UI you'd merge.

## Source of truth

- Product: the [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) is the source of truth. [docs/prd.md](docs/prd.md) mirrors it. If they diverge, the Doc wins. Do not invent product locks beyond the Doc.
- North owns product discussion.
- Dev owns engineering, the repo, and coding.
- Engineering docs come later, with Gopi. Do not add `engineering.md` until then.

## Working rules

- The harness owns the loop and runtime (planning and model included). Taste supplies context, tools, and checks. Taste is not an agent runtime.
- Taste is a pack, an MCP server, and agents. It is not a design system, and it is not a component library.
- Shipped wins over stated preferences. When they conflict, what's shipped is the source of truth.
- Conformance on HelloAlly ally-platform first. Expression on omnipresent later.
- Critic is a harness subagent: a review pass on a bigger model, with carefully crafted prompts and skills. GAN-inspired for now (generator vs critic); that may change.
- v0 baseline is LangChain Content Studio and Anthropic frontend-skills. Follow that baseline. It is not locked; architecture gets locked after more research and experiments.

This repo is docs only until engineering work is in scope with Gopi. Do not add application code, a package manifest, or an MCP server stub.
