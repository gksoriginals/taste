# Taste

Taste is a plugin for an existing coding harness (Cursor, Codex, or Claude Code). Skills and a local MCP server drive four steps on **the product repository**, not on this repo:

1. Set up one Pack at `taste/`.
2. Sweep shipped UI and/or Expression-interview new judgment into Decisions.
3. Load that Pack before UI work. Conformance uses Decisions that are accepted, have shipped evidence, and have no coverage gap.
4. Learn through Expression: new requirements, gaps, and corrections are written back into the same Pack.

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

Use any product repo. A throwaway git repo is enough. It does not need to be Ally. Install the plugin in the harness first, then open the **product** repo (not this plugin repo) in that harness.

Say these prompts in order. Wait for each one to finish, and look at `taste/` in the product repo after steps 2 and 4.

1. **Setup**

   > Set up Taste for this repository. Initialize one Pack under taste/. The product is called Fieldnote. Do not invent shipped decisions. Do not add a CI gate.

   Expect `taste/manifest.json`, `taste/skills/product-design/SKILL.md`, and `taste/skills/product-design/references/decisions/README.md`. No `supportedModes` field. No `references/conformance/` or `references/expression/` trees.

2. **Expression interview**

   > Interview me and record Taste signals in the Pack with taste_record_signal. Three signals: each screen has one filled primary button; field errors sit under the field; spacing is dense but not cramped. Scope them to settings. Leave them proposed until I accept each sentence.

   Answer the questions in chat. Then say:

   > I accept all three statements. Update those Decisions to accepted. There is no shipped UI yet.

   Expect three files under `taste/skills/product-design/references/decisions/`. `status: accepted`, `shipped: false`, `trigger: interview`. `taste_part_state` should still derive Expression (`accepted_not_shipped`), because nothing has shipped.

3. **UI from the Pack**

   > Design a settings screen for notification preferences. Load the Taste Pack before you write UI. Use the accepted Decisions. This part is not Conformance yet; follow Expression for anything the Decisions do not justify, and do not mark them shipped unless you inspected a shipped screen.

   Expect the screen to use one primary button, inline field errors, and dense spacing. Expect no new Conformance claim.

4. **Correction**

   > The settings screen used two primary buttons. That fails the signal. Correct the UI and record the correction on the same Decision with taste_record_signal, trigger rejected_pass, coverage gap true.

   Expect the same decision file updated (`trigger: rejected_pass`, `coverage_gap: true`), not a second Pack and not a new mode field. Other Decisions, if you added any, stay as they were.

5. **Confirm**

   > Show taste_part_state for scope settings and quote the Decision files you changed.

   You should see the files on disk in the product repo. Chat summaries do not count.

Optional, if the product already has UI: ask for `taste-sweep` on one flow before step 3. Sweep should write `proposed` Decisions with `trigger: sweep` and real screenshot or URL evidence, and should not set `accepted` unless you explicitly accept the statement.

## Docs

- [docs/prd.md](docs/prd.md) — PRD mirror of the Google Doc plus Gopi and North's locked decisions
- [docs/engineering.md](docs/engineering.md) — system design and what the code actually does
- [docs/implementation-plan.md](docs/implementation-plan.md) — v1 plumbing, not a finished product
- [docs/plugin-development.md](docs/plugin-development.md) — local plugin setup
- [docs/plugin-workflows.md](docs/plugin-workflows.md) — which skill fires when
- [docs/validation-results.md](docs/validation-results.md) — synthetic eval smoke only
- [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) — product source of truth

Read [agent.md](agent.md) before changing project conventions.
