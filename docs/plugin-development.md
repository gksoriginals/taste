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

When a product repository has a Pack at `taste/`, the plugin tools take its absolute repository path from the host harness. To create a starter Pack, invoke `taste_pack_initialize` with that path and the product name. Initialization only creates `taste/` and never edits the repository's `AGENTS.md`, `CLAUDE.md`, or other harness instructions. The coding agent can use `taste_pack_write` to update Pack files; this tool confines paths to `taste/`, rejects symlink parents, and limits writes to 256 KiB. The coding agent should review and replace starter prompts with product evidence before relying on them.

## Development checks

```sh
npm ci
npm run typecheck
npm test
npm run validate:package
```

`npm test` bundles the server and exercises Pack safety, the two-mode Pack, generator/Judge context separation, manifest schemas, and a real MCP stdio client/server exchange. `claude plugin validate .` checks Claude's native package metadata. Package validation is static and does not prove that every installed harness version can load the plugin.

Use the named portable workflow Skills when explicitly invoking setup, sweep, Conformance, Expression, or evaluation. `taste-design` is the auto-relevant entry for UI/UX work when a Pack exists. See [plugin-workflows.md](plugin-workflows.md) for exact triggers and outcomes. Skills are the portable workflow definitions; Cursor-specific command files are not duplicated in this package.

Evaluation tools deliberately return different packets. The generator gets task instructions and the before state; the Judge packet gets the task, rubric, and expected after state. The host harness is responsible for running a higher-capacity Judge in a separate context. This separation limits answer leakage in the workflow; it is not a security boundary against a harness that ignores instructions.

## Official references

- [Agent Plugins](https://agent-plugins.org/) and its [1.0.0 specification](https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md)
- [OpenAI: Build plugins](https://developers.openai.com/plugins/build/plugins)
- [Cursor: Plugins](https://cursor.com/docs/plugins)
- [Claude Code: Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code: MCP servers in plugins](https://code.claude.com/docs/en/plugins#configure-mcp-servers)
- [MCP: Build a server](https://modelcontextprotocol.io/docs/develop/build-server)
