# Contributing

Taste is a plugin for existing coding harnesses. Product decisions live in [docs/prd.md](docs/prd.md). Engineering design lives in [docs/engineering.md](docs/engineering.md).

## Local setup

Node.js 20 or later.

```sh
git clone https://github.com/gksoriginals/taste.git
cd taste
npm ci
```

Install the plugin into a host from this checkout using the paths in the [README](README.md). The bundled `dist/server.js` is committed so a host can start the MCP server without a build. After you change TypeScript, rebuild before committing:

```sh
npm run build
```

`npm test` also rebuilds `dist/server.js`.

## Checks

Run these before opening a pull request:

```sh
npm run typecheck
npm test
npm run validate:package
```

- `npm run typecheck` is `tsc --noEmit`.
- `npm test` builds the server and covers Pack safety and lifecycle, evaluation packets, and an MCP stdio client/server exchange.
- `npm run validate:package` checks the portable manifests, host adapters, and Skill frontmatter.

These commands do not install the plugin into Cursor, Claude Code, or Codex. For host-specific packaging changes, validate the affected host when available and report what you actually verified. Unit and package checks do not prove a graphical host loaded the plugin.

`npm run validate:claude` needs the Claude Code CLI. It is optional.

## Pull requests

- Describe the harness-visible or user-visible change, and which product rule it follows. Do not add a product decision that [docs/prd.md](docs/prd.md) does not already state. Open questions stay open.
- Keep Conformance and Expression as task approaches, not persistent Pack modes. The Pack stays in the product repository at `taste/`. The host owns product inspection, implementation, checks, self-review, and delegation.
- Include the rebuilt `dist/server.js` when `src/` changes.
- Do not commit secrets, `.env` files, credentials, or private product data.
- Docs should be readable without private drafts or a particular product as required context.
