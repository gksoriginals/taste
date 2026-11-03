<h1 align="center">Taste</h1>
<p align="center"><strong>Teach agents your product’s design taste. Carry it across screens and harnesses.</strong></p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-355f4c" alt="License: MIT"></a>
  <a href="docs/prd.md"><img src="https://img.shields.io/badge/status-early_harness_plugin-e8c65a" alt="Status: early harness plugin"></a>
  <a href="docs/plugin-development.md"><img src="https://img.shields.io/badge/MCP-local_server-355f4c" alt="MCP: local server"></a>
</p>
<p align="center"><a href="#install">Install</a> · <a href="docs/prd.md">Docs</a> · <a href="CONTRIBUTING.md">Contributing</a> · <a href="docs/harness-smoke-test.md">Smoke test</a></p>

Taste teaches coding agents a product’s design taste: style, UX, interaction, copy, and the other choices that make the UI feel like that product. The point is a first pass that stays consistent across screens, tasks, and harnesses, without a long design prompt for every screen.

It is an early-stage plugin for [Cursor](https://cursor.com/), [Codex](https://developers.openai.com/codex), and [Claude Code](https://code.claude.com/). Skills and a local MCP server load into the harness you already use. The harness still implements, tests, reviews, and ships.

## Architecture

Taste has three parts.

- **Pack.** One `taste/` directory in the product repository. It holds that product’s Skills, sourced references, and evolving design checklists beside the code.
- **Plugin.** This repository. Its Skills and local MCP server are installed into the coding harness. They read and update product-specific Pack guidance and checklists.
- **Host.** Cursor, Codex, or Claude Code. The host maps product surfaces, implements UI, runs checks, self-reviews and ships. Taste does not.

```text
product repository                      coding harness
taste/  Product Skills + checklists    ←→    Taste plugin (Skills + local MCP)
                                           ↑
                                 Cursor, Codex, or Claude Code
                                 implements, tests, reviews, ships
```

The plugin loads the product Skill and relevant checklists before UI work. The host updates reusable checklist guidance directly from resolved user feedback in the ongoing conversation.

## Core principles

- **Judgment stays with the product.** The Pack is committed beside the code it describes.
- **Harnesses follow the Pack.** Cursor, Codex, and Claude Code read the same decisions.
- **One Pack per product.**
- **Taste does not run tests or ship for you.** The host owns implementation, checks, self-review, and push.
- **Learn in the conversation.** When you reject a direction or correct a design choice, the host applies the feedback and records a clear reusable checklist item after checking its work. No separate human review or promotion step is required.
- **Keep unresolved exploration in the task.** Open alternatives and one-off feedback stay in the host's current task; resolved reusable guidance goes into the scoped checklist.

## How a task runs

1. You ask for UI work in a product repository.
2. The host loads `taste/` when a Pack is already there. On the first UI request without a Pack, it sweeps the existing product, builds and self-checks a tailored Pack, then continues your original task. You do not need a separate setup request.
3. When the Pack already covers that UI, the host applies those decisions.
4. When you ask for a new direction or make a correction, the host explores and revises in the current task.
5. The host runs applicable product checks and self-checks the result.
6. If your feedback expresses a reusable lesson, the host applies it, self-checks the result, and updates the relevant checklist in `taste/` as part of the task. One-off or unresolved reactions stay in the conversation. If no Pack exists yet, it creates and populates one after the whole-product sweep or once reusable guidance emerges.

## Composing the Pack

When you ask to set up Taste for a product with existing UI, the host sweeps the whole user-facing product before initializing the Pack. It inventories routes and surfaces, inspects rendered flows and reachable states, and correlates screenshots with source, Git history, design files, and reviews. The host may split bounded surfaces across its available tasks or agents, then reconciles the findings.

The host turns verified evidence into a tailored `product-design` entry Skill and only the product-specific references, checklists, and metadata that are useful for the product. The entry Skill routes by request mode and surface, then loads the relevant material. The host self-checks coverage, traceability, accuracy, consistency, and usefulness; there is no separate human review or approval stage. The minimal starter files are a scaffold, not a completed Pack. Initialization fails if `taste/` already exists.

Do not treat every repeated pattern as intentional product policy. Mark observed patterns and host inferences distinctly, with sources and confidence. In normal design conversations, user corrections, rejections, and disagreements are direct feedback: the host applies them, then adds clear reusable lessons to scoped checklists without asking for separate Pack or Decision approval. One-off or unresolved preferences stay in the active task. Gaps and uncertain areas remain visible in metadata. Greenfield work continues through transient Expression and gains checklist guidance as the user and host resolve decisions together.

## Try it

Install Taste in your coding harness, open a **product repository**, and ask for a UI task in natural language. For example:

> Use Taste while simplifying the settings screen. When I correct the design, revise it and add a reusable checklist item from my feedback after checking the result. Do not ask for a separate Pack update approval.

The harness should load an existing `taste/` Pack before UI work. If none exists, sweep the whole existing product UI and create a tailored Pack after host self-review; for greenfield UI, add reusable checklist guidance as it emerges in the task. For a step-by-step check, see the [harness smoke-test guide](docs/harness-smoke-test.md). Record what you actually observed in the [smoke-results template](docs/harness-smoke-results.md). That sheet stays unverified until a real host run fills it.

## Install

Taste requires Node.js 20 or later. The bundled MCP server is committed, so you do not need to build it to install the plugin. Installation details can change with host releases; these are the repository’s current local development paths.

<details>
<summary><strong>Cursor</strong></summary>

Cursor needs its own manifest and MCP path expansion. From the Taste checkout:

```sh
mkdir -p ~/.cursor/plugins/local/taste
rsync -a \
  --exclude .git \
  --exclude plugin.json \
  --exclude mcp.json \
  --exclude .mcp.json \
  --exclude .claude-plugin \
  --exclude .claude.mcp.json \
  --exclude .codex-plugin \
  --exclude .agents \
  ./ ~/.cursor/plugins/local/taste/
```

Reload Cursor, then check **Customize** for Taste’s Skills and MCP server. The local plugin import setting may need to be enabled by your organization. Cursor uses `.cursor-plugin/plugin.json` and `.cursor.mcp.json` in the copied folder.

</details>

<details>
<summary><strong>Codex</strong></summary>

Open this repository in Codex and select the `taste-local` repository marketplace from `.agents/plugins/marketplace.json`. To register it from the CLI:

```sh
codex plugin marketplace add /absolute/path/to/taste
```

</details>

<details>
<summary><strong>Claude Code</strong></summary>

From a Taste checkout, launch Claude Code with:

```sh
claude --plugin-dir /absolute/path/to/taste
```

</details>

## Product Pack

Each product has one Pack at `taste/`:

A new Pack starts with only a README, `manifest.json`, and a product-design entry Skill. The host derives the rest from the whole-product sweep: it may create a surface map, focused references, checklists, shared facts, examples, or evaluation material when those are useful for this product. There is no fixed reference catalog; avoid empty files and generic categories that do not fit the product.

Checklist guidance is scoped to product surfaces and task types, not one switch for the whole Pack. The host updates a reusable checklist from direct user feedback after applying and self-checking the result. Structured Decision records and their approval evidence remain a legacy format; they are not required for this learning flow.

## Diagnostics

The local MCP server writes structured diagnostics to stderr, keeping stdout available for MCP messages. By default, it logs tool failures and stable error codes only. To debug a harness run, set `TASTE_LOG_LEVEL=debug` in the MCP server’s environment. Debug events include startup, tool names, outcomes, and durations; they do not include arguments, Pack contents, conversation text, or repository paths. Use `TASTE_LOG_LEVEL=off` to disable diagnostics. See [plugin development](docs/plugin-development.md) for more detail.

## Develop and validate

```sh
npm ci
npm run typecheck
npm test
npm run validate:package
```

`npm test` builds the bundled server and exercises Pack safety, recording Decisions, task routing, and an MCP stdio client/server exchange. Package checks verify the portable manifests and host adapters. They do not prove that a GUI harness loaded the plugin; use the [smoke-test guide](docs/harness-smoke-test.md) in each host you plan to support, and record the run in the [smoke-results template](docs/harness-smoke-results.md). Local setup and pull-request checks are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project docs

- [Product direction](docs/prd.md)
- [Engineering design](docs/engineering.md)
- [Plugin development and host adapters](docs/plugin-development.md)
- [Workflow and skill routing](docs/plugin-workflows.md)
- [Implementation plan](docs/implementation-plan.md)
- [Synthetic evaluation results](docs/validation-results.md)
- [Harness smoke-test guide](docs/harness-smoke-test.md)
- [Harness smoke results](docs/harness-smoke-results.md) (unverified until filled)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

Package tests and the synthetic evaluation do not show that Taste improves a real product. Try it in your harness and product repository.

## License

[MIT](LICENSE) © 2026 Gopikrishnan Sasikumar
