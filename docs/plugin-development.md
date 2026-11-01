# Plugin development

Taste is an add-on for a coding harness. The harness remains the coding agent and owns models, planning, delegation, and repository access. Taste provides Skills and MCP tools that agent can invoke.

## Plugin layout and harness support

The repository root is a portable Agent Plugins package:

- `plugin.json` declares the package and its version.
- `skills/` contains the plugin workflows loaded by the host agent.
- `mcp.json` starts the bundled stdio MCP server using a package-relative path.
- `.agents/plugins/marketplace.json` makes the root package discoverable from this repository in Codex's local plugin marketplace.
- `.claude-plugin/plugin.json` and `.mcp.json` are Claude Code's native compatibility files. They point at the same Skills and server.

Codex and Cursor can consume the Agent Plugins package. Claude Code currently uses its native plugin format. These are adapters around one implementation, not separate Taste products. The agent plugin standard and each harness evolve; verify the linked official documentation before changing manifests or install instructions.

The local install source for development is this repository. A published release or marketplace can be added later without changing the Pack format. The bundled `dist/server.js` is committed so an installed plugin can start without running a build step. Run `npm run build` after changing TypeScript.

## Install and smoke check

For Codex, open this repository in the desktop app and select the `taste-local` repo marketplace. The repository-local catalog at `.agents/plugins/marketplace.json` points to the root package. To register the repo marketplace through the CLI, run `codex plugin marketplace add /absolute/path/to/taste`; this changes the user's Codex marketplace configuration.

For Claude Code, from a checkout run:

```sh
claude --plugin-dir /absolute/path/to/taste
```

The root Agent Plugins manifests are the portable package format for Codex and Cursor. Cursor's plugin manager can load the package from its repository or release source. Do not copy Taste Skills into provider-specific project folders; the harness should load the plugin and the Pack should remain in the product repository.

When a product repository has a Pack at `taste/`, the plugin tools take its absolute repository path from the host harness. `taste_pack_initialize` creates one shared Pack and never edits `AGENTS.md`, `CLAUDE.md`, or other harness instructions. Expression and Sweep persist Decisions with `taste_record_signal`. `taste_pack_write` remains for other files inside `taste/`; it rejects symlink parents and limits writes to 256 KiB. Starter files are not product knowledge.

The portable `mcp.json` runs `node ./dist/server.js` with `cwd` `./`, which the Agent Plugins schema treats as the plugin root. Cursor also expands `${CURSOR_PLUGIN_ROOT}` in MCP config, but this package keeps the relative path so Codex and the schema check stay on one command. Claude Code uses `.mcp.json` and `${CLAUDE_PLUGIN_ROOT}`. The committed `dist/server.js` is what an install runs; rebuild it after TypeScript changes.

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
