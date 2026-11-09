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

For Claude Code, install from the repository marketplace in `.claude-plugin/marketplace.json` (`claude plugin marketplace add gksoriginals/taste`, then `claude plugin install taste@taste`), or load a checkout for one session with `claude --plugin-dir /absolute/path/to/taste`. To test unpushed changes in new sessions, add a local checkout as a marketplace (`claude plugin marketplace add /absolute/path/to/taste`).

Cursor's explicit `/taste-setup` command lives in `cursor/commands/`, referenced only by `.cursor-plugin/plugin.json`. Claude Code and Codex reach setup through the `taste-setup` Skill, so the command stays out of the root `commands/` directory that Claude Code would auto-load as a duplicate.

The root Agent Plugins manifests are the portable package format for Codex and compatible hosts. Cursor's local copy must use `.cursor-plugin/plugin.json` and `.cursor.mcp.json`; the README copy command excludes the root portable manifests to avoid Cursor loading the unsupported `${PLUGIN_ROOT}` path. Do not copy Taste Skills into provider-specific project folders; the harness should load the plugin and the Pack should remain in the product repository.

The host passes an absolute repository path to Pack tools. `taste_pack_initialize` creates a minimal shell marked `in_progress`; it never edits `AGENTS.md`, `CLAUDE.md`, or other harness instructions. Broad setup and refresh run only through the explicit `/taste-setup` command in Cursor or the `taste-setup` Skill in other hosts. Setup inventories apps and routes before choosing a bounded scope, but the Pack records only representative coverage useful for finding retained guidance, not every route visited. It does not create a Pack when no product UI or UI source exists. A Pack preserves durable product judgment—decisions and reasons, tested lessons, and traps from use that future work is unlikely to recover by rereading code or reopening the screen. It links to canonical sources instead of restating them and distinguishes observation, inference, and settled intent. Source-only inspection can support cited, actionable `usable_partial` guidance under the default `source_reviewed` policy, with visual behavior marked unverified; `rendered_flow` requires a representative rendered journey. Before recording a journey as blocked, setup starts the product the documented way (repository docs, scripts, compose and launch configs, seed scripts, and the harness's own notes) and signs in with documented local test accounts; a blocked entry lists those `accessAttempts`. Required `not_inspected` entries also list attempts, unless the gap explains why trying was unsafe or outside confirmed scope. Rendered entries list `statesObserved`, and `complete` needs every `setupScope.requiredStates` state (default populated). Continue on accessible scope when another app or journey is blocked, and record coverage gaps. Keep audit findings and operational notes separate from Pack guidance. Evaluation fixtures are optional. Refresh removes duplicative or low-value content as well as stale claims, preserving only supported lessons. `in_progress`, `usable_partial`, and `complete` describe Pack readiness; per-surface coverage remains separately recorded. Interrupted setup preserves existing files and the most accurate status so the host can resume.

Ordinary UI work does not trigger broad setup or a sweep. It can, however, learn from a clear reusable correction: after applying the change and keeping it only when existing checks show improvement or no regression, the host may update scoped guidance or create a minimal Pack for only that surface. Preserve product evidence and include rationale or rejected options when they help future work recover the judgment. Unresolved alternatives stay in the task. New product or surface design can proceed in Expression before a Pack exists. `taste_pack_write` writes files inside `taste/`, rejects symlink parents, and limits writes to 256 KiB. Starter files are not product knowledge.

## MCP diagnostics

The server writes structured diagnostics to stderr so stdio MCP messages on stdout remain valid. Default `error` logging records tool failures and stable Taste error codes only. Set `TASTE_LOG_LEVEL=debug` in the harness's MCP server environment to log startup, tool names, outcomes, and durations. Inputs and results are never logged: this excludes repository paths, Pack contents, and conversation-derived text. Set `TASTE_LOG_LEVEL=off` to disable logging.



The portable `mcp.json` uses the host-provided `${PLUGIN_ROOT}` in both the launch path and working directory. The Codex CLI `.mcp.json` uses package-relative `./` paths because Codex 0.144.1 resolves `cwd` relative to the installed plugin root but does not expand `${PLUGIN_ROOT}` in that config. Both resolve to the installed copy without a machine-specific path. Claude Code uses `.claude.mcp.json` and `${CLAUDE_PLUGIN_ROOT}`. The committed `dist/server.js` is what an install runs; rebuild it after TypeScript changes.

## Development checks

```sh
npm ci
npm run typecheck
npm test
npm run validate:package
```

`npm test` bundles the server and exercises Pack safety, shared-Pack init, evidence and lifecycle validation, generator/Judge context separation, manifest schemas, and a real MCP stdio client/server exchange. `claude plugin validate .` checks Claude's native package metadata when the Claude CLI is installed. Package validation does not prove a GUI harness loaded the plugin.

`taste-design` is the entry Skill for UI work. It routes the host to applicable Pack guidance and workflow Skills. The host still performs the design and validation work.

Evaluation tools deliberately return different packets. The generator gets task instructions and the before state; the Judge packet gets the task, rubric, and expected after state. The host harness is responsible for running a higher-capacity Judge in a separate context. This separation limits answer leakage in the workflow; it is not a security boundary against a harness that ignores instructions.

## Official references

- [Agent Plugins](https://agent-plugins.org/) and its [1.0.0 specification](https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md)
- [OpenAI: Build plugins](https://developers.openai.com/plugins/build/plugins)
- [Cursor: Plugins](https://cursor.com/docs/plugins)
- [Claude Code: Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code: MCP servers in plugins](https://code.claude.com/docs/en/plugins#configure-mcp-servers)
- [MCP: Build a server](https://modelcontextprotocol.io/docs/develop/build-server)
