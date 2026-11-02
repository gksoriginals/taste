<h1 align="center">Taste</h1>
<p align="center"><strong>Keep the judgment with the product. Let the harness follow the Pack.</strong></p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-355f4c" alt="License: MIT"></a>
  <a href="docs/prd.md"><img src="https://img.shields.io/badge/status-early_harness_plugin-e8c65a" alt="Status: early harness plugin"></a>
  <a href="docs/plugin-development.md"><img src="https://img.shields.io/badge/MCP-local_server-355f4c" alt="MCP: local server"></a>
</p>
<p align="center"><a href="#install">Install</a> · <a href="docs/prd.md">Docs</a> · <a href="CONTRIBUTING.md">Contributing</a> · <a href="docs/harness-smoke-test.md">Smoke test</a></p>

Taste helps a coding harness carry a product’s approved UI decisions across screens, tasks, and sessions. Product knowledge lives in a versioned `taste/` Pack inside the product repository.

Taste is an early-stage plugin for [Codex](https://developers.openai.com/codex), [Cursor](https://cursor.com/), and [Claude Code](https://code.claude.com/). It provides reusable Skills and a local MCP server; the host harness remains responsible for implementation, tests, review, and shipping.

## What Taste does

- **Keeps product decisions with the product.** A Pack is committed alongside the code it describes and can be read by different supported harnesses.
- **Applies established direction.** Conformance uses accepted Decisions that have matching validation and user-approval evidence, inspected shipped evidence, and no unresolved coverage gap.
- **Explores requested changes.** Expression handles greenfield work, new directions, corrections, and gaps. Exploratory feedback stays in the host’s active task while the design is changing.
- **Learns at the right time.** After the host’s relevant checks pass and the user approves the exact tested artifact, the host automatically records a concise reusable Decision. There is no separate confirmation to write the Pack.

The Pack is not updated from an early “I like this direction” reaction. Taste does not run tests, decide readiness, review the design on the user’s behalf, or push changes.

## How it works

```text
User request
    ↓
Host loads the Taste Pack and routes the task per UI part
    ↓
Conformance applies accepted shipped Decisions
Expression explores new direction or corrections; feedback stays task-local
    ↓
Host implements and runs its own checks
    ↓
User approves the exact tested artifact
    ↓
Host records the reusable Decision in taste/
```

When a user asks to change an existing UI, the host passes that intent to Taste. `taste_part_state` returns a task-local Expression route even if the Pack still derives to Conformance. The Pack’s durable state is left untouched during exploration.

## Try it

Install Taste in your coding harness, open a **product repository**, and ask for a UI task in natural language. For example:

> Use Taste while simplifying the settings screen. Keep exploratory feedback out of the Pack. After the implementation passes this repository’s checks, show me the tested version; when I approve it, record the reusable decision.

The harness should load an existing `taste/` Pack before UI work. If no Pack exists, a design task starts with transient Expression; setup is deferred until the tested artifact is approved. For a step-by-step check of both greenfield and existing-Pack workflows, see the [harness smoke-test guide](docs/harness-smoke-test.md). Record what you actually observed in the [smoke-results template](docs/harness-smoke-results.md). That sheet stays unverified until someone fills it from a real host run.

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

Decisions are scoped to product parts. Conformance and Expression are derived activities, not folders or a Pack-wide switch. If an approved artifact changes, the host must revalidate it and get approval for that version before updating its Decision; a changed artifact does not inherit the previous version’s shipped evidence.

## Diagnostics

The local MCP server writes structured diagnostics to stderr, keeping stdout available for MCP messages. By default, it logs tool failures and stable error codes only. To debug a harness run, set `TASTE_LOG_LEVEL=debug` in the MCP server’s environment. Debug events include startup, tool names, outcomes, and durations; they do not include arguments, Pack contents, conversation text, or repository paths. Use `TASTE_LOG_LEVEL=off` to disable diagnostics. See [plugin development](docs/plugin-development.md) for more detail.

## Develop and validate

```sh
npm ci
npm run typecheck
npm test
npm run validate:package
```

`npm test` builds the bundled server and exercises Pack safety, Decision promotion, derived routing, and an MCP stdio client/server exchange. Package checks verify the portable manifests and host adapters. They do not prove that a GUI harness loaded the plugin; use the [smoke-test guide](docs/harness-smoke-test.md) in each host you plan to support, and record the run in the [smoke-results template](docs/harness-smoke-results.md). Local setup and pull-request checks are in [CONTRIBUTING.md](CONTRIBUTING.md).

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

Taste is still plumbing toward the larger goal: helping coding agents produce UI that reflects a product’s approved design judgment. Synthetic evaluations and package tests are not evidence that it improves real product outcomes; validate it in your actual harness and product repository.

## License

[MIT](LICENSE) © 2026 Gopikrishnan Sasikumar
