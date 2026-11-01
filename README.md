# Taste

Taste is a plugin for an existing coding harness (Cursor, Codex, or Claude Code). Skills and a local MCP server drive the workflow on **the product repository**, not on this repo:

1. For an explicit setup request, create one Pack at `taste/`. For a UI task with no Pack, keep it absent while Expression explores and the host implements, reviews, and checks the design.
2. When a Pack exists, load it before UI work. Conformance uses accepted Decisions with host-reported validation and user-approval evidence, shipped evidence, and no coverage gap.
3. Keep new direction, early reactions, and iteration feedback in the host task context.
4. For a greenfield UI task, create the Pack and record a Decision only after the host reports checks passed and the user approves the exact tested artifact and reusable Decision. An agent's review is not user approval. The host owns checks, review, readiness, and push timing.

Expression is the learner. There is no second Learner module, no daemon, and no hard CI gate in this slice. This repository is the plugin. Packs live in the product repo.

Codex and Cursor use the portable [Agent Plugins](https://agent-plugins.org/) package at this repository root. Claude Code uses the same Skills and server through `.claude-plugin/` and `.mcp.json`.

## Install in a harness

Requirements: Node.js 20 or later. `dist/server.js` is committed; you do not need to build before install unless you are changing TypeScript.

```sh
npm install
npm test
```

### Cursor

Cursor loads this root `plugin.json` as an Agent Plugin (skills + MCP). Local plugins are copied, not symlinked out of the folder:

```sh
mkdir -p ~/.cursor/plugins/local/taste
# Copy the plugin. A symlink that points outside ~/.cursor/plugins/local is ignored.
rsync -a --exclude .git ./ ~/.cursor/plugins/local/taste/
```

Restart Cursor, or run **Developer: Reload Window**. Open **Customize** and confirm the Taste skills and the `taste` MCP server. Enterprise installs need **Allow Local Plugin Imports** enabled. If a marketplace plugin named `taste` is already installed, that copy wins over the local folder.

The MCP server is `node ./dist/server.js` with working directory `.` (the plugin root). Node must be on `PATH`.

### Claude Code

From a checkout of this repo:

```sh
claude --plugin-dir /absolute/path/to/taste
```

### Codex

Open this repository and select the `taste-local` repo marketplace (`.agents/plugins/marketplace.json`). To register it from the CLI: `codex plugin marketplace add /absolute/path/to/taste`.

More detail: [docs/plugin-development.md](docs/plugin-development.md).

## Harness end-to-end check

Use any product repo. A throwaway git repo is enough. It does not need to be Ally. Install the plugin in the harness first, then open the **product** repo (not this plugin repo) in that harness. To verify the greenfield approval gate, skip the explicit setup prompt below and start with a design task; `taste/` should remain absent until final approval.

Say these prompts in order. Wait for each one to finish. The Pack must remain unchanged through draft exploration and update only at the final approved-artifact checkpoint.

1. **Setup**

   > Set up Taste for this repository. Initialize one Pack under taste/. The product is called Fieldnote. Do not invent shipped decisions. Do not add a CI gate.

   Expect `taste/manifest.json`, `taste/skills/product-design/SKILL.md`, and `taste/skills/product-design/references/decisions/README.md`. No `supportedModes` field. No `references/conformance/` or `references/expression/` trees.

2. **Expression exploration**

   > Interview me about the settings screen. I want one filled primary button, field errors under their fields, and spacing that is dense but not cramped. Keep these signals in the host task while we explore; do not write Decisions to the Pack yet.

   Answer the questions in chat. Then say:

   > I like this direction. Build the first version, but do not update the Pack yet.

   Expect no Decision files. The host should continue implementation and follow the product repository's existing validation and review workflow.

3. **UI from the Pack**

   > Design a settings screen for notification preferences. Load the Taste Pack before you write UI. Use the interview direction from this task. Do not add a Decision to the Pack while the version is in progress.

   Expect the screen to use one primary button, inline field errors, and dense spacing. Expect no new Conformance claim.

4. **Validate and approve**

   > The settings screen used two primary buttons. Correct it and rerun the checks this repository uses. Keep the failed version and correction in the host task. Show me the tested final version and a concise Decision for approval.

   Do not write a Decision for the failed version or unresolved gap. After the user approves the tested final version and Decision, call `taste_record_signal` with the exact artifact reference, host-reported validation results, matching user-approval evidence, `status: accepted`, and `coverageGap: false`. Include shipped evidence only if the host inspected an actually shipped version.

5. **Confirm**

   > Show taste_part_state for scope settings and quote the Decision files you changed.

   You should see the files on disk in the product repo. Chat summaries do not count.

Optional, if the product already has UI: ask for `taste-sweep` on one flow. Keep candidate judgments in the host task until the owner approves the Decision and the host supplies evidence for the inspected artifact. Do not write `proposed` Decisions during the sweep.

## Docs

- [docs/prd.md](docs/prd.md) — PRD mirror of the Google Doc plus Gopi and North's locked decisions
- [docs/engineering.md](docs/engineering.md) — system design and what the code actually does
- [docs/implementation-plan.md](docs/implementation-plan.md) — v1 plumbing, not a finished product
- [docs/plugin-development.md](docs/plugin-development.md) — local plugin setup
- [docs/plugin-workflows.md](docs/plugin-workflows.md) — which skill fires when
- [docs/validation-results.md](docs/validation-results.md) — synthetic eval smoke only
- [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) — product source of truth

Read [agent.md](agent.md) before changing project conventions.
