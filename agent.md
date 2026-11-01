# Agent notes

Collaboration notes for Cursor and Grok Bot in this repo.

## Product

Taste is a plugin for existing coding harnesses (Cursor, Codex, Claude Code). The Pack lives in the product repository at `taste/`, not in this repo. Skills and MCP tools set up that Pack, sweep or interview judgment into it, load it before UI work, and write new signals through Expression. Taste does not configure or run an agent, and it does not run a daemon. From what's shipped, a harness given a PRD and the Taste Pack should first-pass UI you'd merge. That outcome is the ambition. The code in this repo is v1 plumbing toward it.

## Source of truth

- Product: the [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) is the source of truth. [docs/prd.md](docs/prd.md) mirrors the Doc and the decisions Gopi and North locked: the five ∞ rules, the expanded open questions, and the Nov 1 harness UX (Expression is the learner; one Pack; no hard CI gate for this milestone). If the Doc and the PRD diverge, the Doc wins. Do not invent product locks beyond those.
- Engineering: [docs/engineering.md](docs/engineering.md) uses LangChain Content Studio's knowledge layers and Anthropic's on-demand Skills as the organizing starting point, with Vercel's in-repo Pack, review, and evals as implementation references. If it and the Doc disagree about the product, the Doc wins.
- North owns product discussion.
- Dev owns engineering, the repo, and coding.

## Working rules

- The harness owns the loop and runtime (planning and model included). Taste supplies Skills and tools. Taste is not an agent runtime and not a daemon.
- One Pack per product repo. Conformance and Expression are derived part activities, not folders and not a `supportedModes` flag. A Decision is Conformance only when it is accepted, has shipped evidence, and has no coverage gap. Otherwise that part is Expression. The Pack never flips as a whole.
- Expression is the learner. Interviews, greenfield signals, coverage gaps, and rejected passes all write Decisions with `taste_record_signal`. There is no separate Learner module.
- Who initiates a move between Expression and Conformance stays open. Do not invent a nudge or an approver.
- For UI work, load the Pack first. Use accepted shipped Decisions for Conformance. Route gaps and new taste through Expression.
- Shipped work is evidence of current behavior, not automatic approval of its flaws. Whether a known flaw sends a part to Expression is an open question. The user's explicit task goal remains the immediate authority for the task in front of them.
- Ally and omnipresent are dogfood notes in the one-pager, not a gate for this repo. A harness end-to-end check on any product repo is the milestone.
- Critique is a review the harness coding agent runs; the harness may delegate it. Taste does not host that agent.
- Keep transient scratch in harness memory. Signals that should survive the turn go into the product's `taste/` Pack.
- `taste_mode_resolve` is deprecated plumbing. Do not treat it as the product rule.

This repository contains the TypeScript plugin and its docs. The portable Agent Plugins package at the repository root is canonical for Codex and Cursor; `.claude-plugin/` and `.mcp.json` provide Claude Code compatibility. Keep product Packs in target repositories. The example under `examples/product-pack/` is a legacy split layout. New Packs use `references/decisions/`.
