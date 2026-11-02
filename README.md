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

- **Pack.** One `taste/` directory in the product repository. It holds that product’s approved design decisions and is committed next to the code.
- **Plugin.** This repository. Its Skills and local MCP server are installed into the coding harness. They read the Pack and, when allowed, write a Decision back.
- **Host.** Cursor, Codex, or Claude Code. The host implements the UI, runs checks, handles review, and ships. Taste does not.

```text
product repository                      coding harness
taste/  Pack of Decisions    ←→    Taste plugin (Skills + local MCP)
                                           ↑
                                 Cursor, Codex, or Claude Code
                                 implements, tests, reviews, ships
```

The plugin loads an existing Pack before UI work. It writes a Decision only after the host’s checks pass and you approve the exact tested artifact.

## Core principles

- **Judgment stays with the product.** The Pack is committed beside the code it describes.
- **Harnesses follow the Pack.** Cursor, Codex, and Claude Code read the same decisions.
- **One Pack per product.**
- **Taste does not run tests or ship for you.** The host owns implementation, checks, review, and push.
- **Recording waits for an approved artifact.** A reusable Decision is written when the host reports that its checks passed and you approve that exact version. An early “I like this direction” does not update the Pack. There is no second step just to confirm the Pack write.
- **Exploration stays in the task.** Drafts, rejected directions, and in-progress feedback stay in the host’s current task. They are not written into the Pack while the design is still changing.

## How a task runs

1. You ask for UI work in a product repository.
2. The host loads `taste/` when a Pack is already there.
3. When the Pack already covers that UI, the host applies those decisions.
4. When you ask for a new direction or a change, the host explores in the current task and leaves the Pack unchanged.
5. The host implements and runs the product repository’s own checks.
6. You approve the exact tested artifact.
7. The host records a short reusable Decision in `taste/`. If the repository had no Pack, it creates one here.

If the artifact changes after that, the old approval does not carry over. The host rechecks the new version, and you approve it, before its Decision is updated.

## Try it

Install Taste in your coding harness, open a **product repository**, and ask for a UI task in natural language. For example:

> Use Taste while simplifying the settings screen. Keep exploratory feedback out of the Pack. After the implementation passes this repository’s checks, show me the tested version; when I approve it, record the reusable decision.

The harness should load an existing `taste/` Pack before UI work. If none exists, the task stays in the conversation until you approve the tested artifact; the Pack is created then. For a step-by-step check of a new Pack and an existing Pack, see the [harness smoke-test guide](docs/harness-smoke-test.md). Record what you actually observed in the [smoke-results template](docs/harness-smoke-results.md). That sheet stays unverified until someone fills it from a real host run.

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

```text
taste/
├── manifest.json
├── skills/product-design/SKILL.md
└── skills/product-design/references/
    ├── shared/product-facts.md
    └── decisions/
```

Decisions are scoped to parts of the product, not one switch for the whole Pack. If an approved artifact changes, the host must revalidate it and get approval for that version before updating its Decision. A changed artifact does not keep the previous version’s shipped evidence.

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
