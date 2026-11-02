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
- `npm test` builds the server and covers Pack safety, Decision promotion, derived routing, and an MCP stdio client/server exchange.
- `npm run validate:package` checks the portable manifests, host adapters, and Skill frontmatter.

These commands do not install the plugin into Cursor, Claude Code, or Codex. When a change affects host install or the promotion flow, follow [docs/harness-smoke-test.md](docs/harness-smoke-test.md) and record only what you observed in [docs/harness-smoke-results.md](docs/harness-smoke-results.md). Leave a host `unverified` if you did not run it.

`npm run validate:claude` needs the Claude Code CLI. It is optional.

## Pull requests

- Describe the harness-visible or user-visible change, and which product rule it follows. Do not add a product decision that [docs/prd.md](docs/prd.md) does not already state. Open questions stay open.
- Keep Conformance and Expression as derived part activities. The Pack stays in the product repository at `taste/`. The host owns checks, review, readiness, and push. Expression’s craft path is detect, ask before install, then a host-owned lock. Taste does not keep a skill shortlist.
- Include the rebuilt `dist/server.js` when `src/` changes.
- Do not commit secrets, `.env` files, credentials, or private product data.
- Docs should be readable without private drafts or a particular product as required context.
