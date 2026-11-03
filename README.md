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

Normal UI work loads an existing, complete Pack and relevant guidance. Reusable user feedback can update its scoped checklist after the host applies and self-checks it. Setup is separate and explicit: run `/taste-setup` in Cursor or invoke the `taste-setup` Skill in other hosts.

## Core principles

- **Judgment stays with the product.** The Pack is committed beside the code it describes.
- **Harnesses follow the Pack.** Cursor, Codex, and Claude Code read the same decisions.
- **One Pack per product.**
- **Taste does not run tests or ship for you.** The host owns implementation, checks, self-review, and push.
- **Learn in the conversation.** When you reject a direction or correct a design choice, the host applies the feedback and records a clear reusable checklist item after checking its work. No separate human review or promotion step is required.
- **Keep unresolved exploration in the task.** Open alternatives and one-off feedback stay in the host's current task; resolved reusable guidance goes into the scoped checklist.

## How a task runs

1. You ask for UI work in a product repository.
2. The host loads `taste/` when a completed Pack is already there. If no Pack exists, the host continues the requested UI task from repository evidence without creating setup; invoke `/taste-setup` explicitly when you want a Pack.
3. The host routes by your task and affected product surface. It applies established sourced guidance (Conformance), explores a new direction, gap, or correction (Expression), or asks a focused question when intent or scope is materially unclear.
4. When you ask for a new direction or make a correction, the host explores and revises in the current task while still using relevant existing guidance.
5. The host runs applicable product checks and self-checks the result.
6. If your feedback expresses a reusable lesson and a completed Pack exists, the host applies it, self-checks the result, and updates the relevant checklist as part of the task. One-off or unresolved reactions stay in the conversation. If no Pack exists, no setup files are written during this task.

## Composing the Pack

Run `/taste-setup` (or invoke the `taste-setup` Skill in a host without slash commands) to create or refresh a Pack. Setup inspects the repository first, chooses a bounded scope from evidence, then sweeps representative rendered flows and states before creating a first Pack. It asks which product/app to configure first only when multiple plausible choices materially change scope. If there is no product UI, or the first-time UI cannot be inspected, it does not create a Pack. Existing Packs are reviewed and selectively updated from supporting evidence. Setup reports surfaces it could not inspect and never changes product UI. New product/surface design can proceed as Expression work without setup.

A new Pack starts with a minimal shell marked `setupStatus: incomplete`. The host marks it complete only after writing and checking repository-specific evidence. If setup is interrupted, the incomplete marker and existing files provide a safe resume path through the same command. Normal UI requests never create or refresh Pack setup. When an existing complete Pack is available, clear reusable feedback can still update its relevant checklist during the normal task without a separate approval step.
Do not treat every repeated pattern as intentional product policy. Mark observed patterns and host inferences distinctly, with sources and confidence. For an existing complete Pack, normal UI conversations can write a clear reusable lesson from resolved user feedback to the relevant checklist after the host applies and self-checks it. No separate Pack or Decision approval is needed. One-off or unresolved preferences stay in the active task. When no Pack exists, do not create one from a UI request; keep new learning in the active task and offer `/taste-setup`.

## Try it

Install Taste in your coding harness and open a **product repository**. Use `/taste-setup` in Cursor (or invoke the `taste-setup` Skill in another host) when you explicitly want to create or refresh the product Pack. For ordinary UI work, ask for the task in natural language. For example:

> Use Taste while simplifying the settings screen. When I correct the design, revise it and add a reusable checklist item from my feedback after checking the result. Do not ask for a separate Pack update approval.

The harness should load an existing complete `taste/` Pack before UI work. If none exists, continue the UI task without writing setup and offer `/taste-setup` as a separate workflow. Invoke setup explicitly to inspect the repository and create or resume a tailored Pack. For a step-by-step check, see the [harness smoke-test guide](docs/harness-smoke-test.md). Record what you actually observed in the [smoke-results template](docs/harness-smoke-results.md). That sheet stays unverified until a real host run fills it.

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

An explicit setup starts with only a README, `manifest.json`, and a product-design entry Skill marked `setupStatus: incomplete`. The host inspects the repository, chooses a bounded scope, then derives any additional references, checklists, facts, examples, or evaluation material from that scope. No fixed reference catalog is required. The host marks setup complete only after it writes and self-checks repository-specific guidance.

Checklist guidance is scoped to product surfaces and task types. During normal UI work, the host may update an existing complete Pack from resolved feedback after applying and self-checking the result. New setup and broad Pack maintenance require explicit `/taste-setup`. Structured Decision records are a legacy format.

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
