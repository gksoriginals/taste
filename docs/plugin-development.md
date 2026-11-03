# Plugin development

Taste is an add-on for a coding harness. The harness remains the coding agent and owns models, planning, delegation, and repository access. Taste provides Skills and MCP tools that agent can invoke.

## Plugin layout and harness support

The repository root is a portable Agent Plugins package:

- `plugin.json` declares the package and its version.
- `skills/` contains the plugin workflows loaded by the host agent.
- `mcp.json` starts the bundled stdio MCP server using the Agent Plugins `${PLUGIN_ROOT}` variable.
- `.agents/plugins/marketplace.json` makes the root package discoverable from this repository in Codex's local plugin marketplace.
- `.codex-plugin/plugin.json` and `.mcp.json` provide the Codex CLI compatibility path for clients that do not load the portable root MCP manifest.
- `.claude-plugin/plugin.json` and `.claude.mcp.json` provide Claude Code's native compatibility path. The Claude manifest points at its MCP config, which launches the same bundled server.
- `.cursor-plugin/plugin.json` and `.cursor.mcp.json` provide Cursor's MCP path using `${CURSOR_PLUGIN_ROOT}`. Cursor loads the Agent Plugins format but does not expand `${PLUGIN_ROOT}` in its MCP configuration, so use the Cursor manifest/config for Cursor installs.

Codex and other standard-compatible hosts can consume the Agent Plugins package. Cursor uses its Cursor-specific manifest/config adapter. Claude Code uses its native plugin format. These are adapters around one implementation, not separate Taste products. The agent plugin standard and each harness evolve; verify the linked official documentation before changing manifests or install instructions.

The local install source for development is this repository. A published release or marketplace can be added later without changing the Pack format. The bundled `dist/server.js` is committed so an installed plugin can start without running a build step. Run `npm run build` after changing TypeScript.

## Install and smoke check

For Codex, open this repository in the desktop app and select the `taste-local` repo marketplace. The repository-local catalog at `.agents/plugins/marketplace.json` points to the root package. To register the repo marketplace through the CLI, run `codex plugin marketplace add /absolute/path/to/taste`; this changes the user's Codex marketplace configuration.

For Claude Code, from a checkout run:

```sh
claude --plugin-dir /absolute/path/to/taste
```

The root Agent Plugins manifests are the portable package format for Codex and compatible hosts. Cursor's local copy must use `.cursor-plugin/plugin.json` and `.cursor.mcp.json`; the README copy command excludes the root portable manifests to avoid Cursor loading the unsupported `${PLUGIN_ROOT}` path. Do not copy Taste Skills into provider-specific project folders; the harness should load the plugin and the Pack should remain in the product repository.

When a product repository has a Pack at `taste/`, the plugin tools take its absolute repository path from the host harness. `taste_pack_initialize` creates one shared scaffold and never edits `AGENTS.md`, `CLAUDE.md`, or other harness instructions. For first-time setup on an existing product, the host sweeps all UI surfaces, may delegate bounded surfaces to available tasks or agents, reconciles evidence, self-reviews the tailored task/surface router, references, checklists, and metadata, then initializes/populates the Pack. No separate human review or approval is required. During design work, the host applies user corrections and disagreements, self-checks the result, and updates reusable checklist items with `taste_pack_write` in the same task. `taste_record_signal` remains a legacy structured Decision writer. `taste_pack_write` cannot write legacy Decision files; it writes other files inside `taste/`, rejects symlink parents, and limits writes to 256 KiB. Starter files are not product knowledge.

## MCP diagnostics

The server writes structured diagnostics to stderr so stdio MCP messages on stdout remain valid. Default `error` logging records tool failures and stable Taste error codes only. Set `TASTE_LOG_LEVEL=debug` in the harness's MCP server environment to log startup, tool names, outcomes, and durations. Inputs and results are never logged: this excludes repository paths, Pack contents, and conversation-derived text. Set `TASTE_LOG_LEVEL=off` to disable logging.

An optional `decisionPromotionCheckpoint` may be stored in `taste/manifest.json` as plain-language reminder text for when the host should invoke Taste. It does not observe test results or configure/execute host checks, user review, readiness, or push timing. The host follows its existing product workflow and chooses before/after-push timing.

The portable `mcp.json` uses the host-provided `${PLUGIN_ROOT}` in both the launch path and working directory. The Codex CLI compatibility `.mcp.json` uses package-relative `./` paths because Codex 0.144.1 resolves `cwd` relative to the installed plugin root but does not expand `${PLUGIN_ROOT}` in that legacy config. Both resolve to the installed copy without a machine-specific path. Claude Code uses `.claude.mcp.json` and `${CLAUDE_PLUGIN_ROOT}`. The committed `dist/server.js` is what an install runs; rebuild it after TypeScript changes.

## Development checks

```sh
npm ci
npm run typecheck
npm test
npm run validate:package
```

`npm test` bundles the server and exercises Pack safety, shared-Pack init, legacy split-Pack validation, Decision writes, derived part state, generator/Judge context separation, manifest schemas, and a real MCP stdio client/server exchange. `claude plugin validate .` checks Claude's native package metadata when the Claude CLI is installed. Package validation does not prove a GUI harness loaded the plugin.

`taste-design` is the skill to select for UI work. It loads the Pack before designing. See [plugin-workflows.md](plugin-workflows.md). The harness end-to-end script is in the [README](../README.md).

Evaluation tools deliberately return different packets. The generator gets task instructions and the before state; the Judge packet gets the task, rubric, and expected after state. The host harness is responsible for running a higher-capacity Judge in a separate context. This separation limits answer leakage in the workflow; it is not a security boundary against a harness that ignores instructions.

## Official references

- [Agent Plugins](https://agent-plugins.org/) and its [1.0.0 specification](https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md)
- [OpenAI: Build plugins](https://developers.openai.com/plugins/build/plugins)
- [Cursor: Plugins](https://cursor.com/docs/plugins)
- [Claude Code: Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code: MCP servers in plugins](https://code.claude.com/docs/en/plugins#configure-mcp-servers)
- [MCP: Build a server](https://modelcontextprotocol.io/docs/develop/build-server)
