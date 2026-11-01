# Taste plugin v1 plumbing

This note describes the first plugin slice: Skills and MCP tools a coding harness can call. The harness remains the coding agent and owns models, repository access, execution, and subagent delegation. Calling a milestone "plumbing" means the code path exists and is tested. It does not mean the product goal — a mergeable first UI pass from a real Pack — is done.

## What this slice includes

### Portable harness plugin

- Skills and a local stdio MCP server in the Agent Plugins root format for Codex and Cursor.
- Claude Code native compatibility metadata over the same Skills and server.
- Manifest checks and local development docs. No daemon and no hosted agent.

### One product Pack

- `taste_pack_initialize` creates a non-overwriting `taste/` Pack with a shared `references/decisions/` home, product facts, authority, and a rubric.
- It does not create separate Conformance and Expression trees and it does not write `supportedModes`.
- Older Packs that still have those trees, including `examples/product-pack/`, still validate. New signals belong in `decisions/`.
- Reviewed product knowledge is committed under the product repo's `taste/`. Scratch notes can stay in harness memory.

### Pack read and write

- Inspect, read, validate, and write files inside `taste/`.
- `taste_record_signal` writes one Decision (Expression interview, Sweep proposal, coverage gap, or rejected pass).
- `taste_part_state` derives Conformance or Expression from status, shipped evidence, and coverage gap. It does not decide who initiates a change.
- Writes stay inside the Pack, reject symlink parents, and cap size at 256 KiB.

### Evaluation packets

- Fixtures store task, before, and after. The generator packet omits the expected after. The Judge packet includes one output, the expected after, and the rubric.
- Fixture lanes are still directory names `conformance` and `expression`. Those names are storage, not Pack modes.
- The synthetic smoke run in [validation-results.md](validation-results.md) checked the packet split. It is not evidence that Taste improves a real product.

### Harness workflows

- `taste-setup`, `taste-sweep`, `taste-design`, `taste-conformance`, `taste-expression`, `taste-pack`, and `taste-evaluate` describe when the harness should call which tool.
- Expression interviews in the harness conversation and must call `taste_record_signal` before the turn ends.
- Sweep requires rendered evidence and writes `proposed` Decisions. A code-only pass is not a finished sweep.
- `taste_mode_resolve` is still registered and tested. It is a deprecated helper and is not the ∞ rule.

## Explicitly out of this slice

- Hard CI gates, a Gate runner, or a required check on pull requests.
- A daemon, or Taste hosting the Critic or Eval Judge. The harness does that when it can.
- Ally-specific dogfood as a blocker. Any product repo is enough for the harness test in the README.
- An answer to who initiates an ∞ change, what "shipped" means, who approves, whether to implement before acceptance, or how known flaws sit with "shipped wins". Those stay open in [prd.md](prd.md).
- A live install proof inside Cursor, Claude Code, or Codex. Automated tests cover the MCP process and Pack files. A person still has to run the harness script once.

## Checks that exist

`npm test` builds `dist/server.js` and covers manifest schema, Pack init, path confinement, legacy Pack validation, Decision write and derived part state, eval packet separation, and a stdio MCP client. `npm run validate:package` checks the Agent Plugins manifests, the Codex marketplace entry, Claude Code compatibility, and Skill frontmatter. Neither check installs the plugin into a GUI harness.
