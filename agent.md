# Agent notes

Collaboration notes for Cursor and Grok Bot in this repo.

## Product

Taste is a plugin for existing coding harnesses (Cursor, Codex, Claude Code). The Pack lives in the product repository at `taste/`, not in this repo. Skills and MCP tools set up that Pack, sweep or interview judgment into it, load it before UI work, and write new signals through Expression. Taste does not configure or run an agent, and it does not run a daemon. From what's shipped, a harness given a PRD and the Taste Pack should first-pass UI you'd merge. That outcome is the ambition. The code in this repo is v1 plumbing toward it.

## Source of truth

- Product: [docs/prd.md](docs/prd.md) records the current implementation direction. The [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) is retained as a reference and has not been updated for the Nov 1 workflow decisions; reconcile or remove it later.
- Engineering: [docs/engineering.md](docs/engineering.md) uses LangChain Content Studio's knowledge layers and Anthropic's on-demand Skills as the organizing starting point, with Vercel's in-repo Pack, review, and evals as implementation references. Keep it aligned with the local PRD and implementation.
- North owns product discussion.
- Dev owns engineering, the repo, and coding.

## Working rules

- The harness owns the loop and runtime (planning and model included). Taste supplies Skills and tools. Taste is not an agent runtime and not a daemon.
- One Pack per product repo. Conformance and Expression are derived part activities, not folders and not a `supportedModes` flag. A Decision is Conformance only when it is accepted, has matching host-reported validation and user-approval evidence, has shipped evidence, and has no coverage gap. Otherwise that part is Expression. The Pack never flips as a whole.
- Expression is the learner, but exploration is transient: keep interviews, early feedback, rejected drafts, and unresolved gaps in the host's active task. Record a Decision only after the host reports checks passed and the user approves the exact tested artifact and Decision. There is no separate Learner module.
- For UI work in a product repo with no `taste/`, keep the Pack absent during drafting, agent review, and checks. Initialize it only after the user approves the exact tested artifact and its reusable Decision. The coding agent's own review is not user approval.
- When the user likes an early direction, Taste's skill nudges the host to continue its own workflow. The host owns implementation, checks, readiness, user review, and push. An optional `decisionPromotionCheckpoint` in the Pack is reminder text; Taste does not observe host events or run those workflows.
- For UI work, load an existing Pack first. Use accepted shipped Decisions for Conformance. If no Pack exists, route through transient Expression and defer initialization until user approval of the tested artifact and Decision.
- Shipped work is evidence of current behavior, not automatic approval of its flaws. The user's explicit task goal remains the immediate authority for the task in front of them.
- Ally and omnipresent are dogfood notes in the one-pager, not a gate for this repo. A harness end-to-end check on any product repo is the milestone.
- Critique is a review the harness coding agent runs; the harness may delegate it. Taste does not host that agent.
- Keep transient scratch in harness memory. Signals that should survive the turn go into the product's `taste/` Pack.
- `taste_mode_resolve` is deprecated plumbing. Do not treat it as the product rule.

This repository contains the TypeScript plugin and its docs. The portable Agent Plugins package at the repository root is canonical for Codex and Cursor; `.claude-plugin/` and `.mcp.json` provide Claude Code compatibility. Keep product Packs in target repositories. The example under `examples/product-pack/` is a legacy split layout. New Packs use `references/decisions/`.
