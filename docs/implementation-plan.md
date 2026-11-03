# Taste plugin v1 plumbing

This note describes the first plugin slice: Skills and MCP tools a coding harness can call. The harness remains the coding agent and owns models, repository access, execution, and subagent delegation. Calling a milestone "plumbing" means the code path exists and is tested. It does not mean the product goal — a mergeable first UI pass from a real Pack — is done.

## What this slice includes

### Portable harness plugin

- Skills and a local stdio MCP server in the Agent Plugins root format for Codex and compatible hosts; Cursor has a Cursor-specific manifest/MCP config for its path expansion.
- Claude Code native compatibility metadata over the same Skills and server.
- Manifest checks and local development docs. No daemon and no hosted agent.

### One product Pack

- `taste_pack_initialize` creates a non-overwriting scaffold only after explicit `/taste-setup` inspects the repository and completes a bounded rendered sweep of accessible product UI. No UI or inaccessible first-time UI means no Pack. The host derives and writes only useful product-specific guidance. Existing Packs are reviewed and selectively refreshed; setup is resumable and normal UI work never starts it implicitly.
- It does not create separate Conformance and Expression trees and it does not write `supportedModes`.
- Older Packs that still have those trees, including `examples/product-pack/`, still validate. Routine user feedback learning belongs in scoped checklist files; structured `decisions/` remain for legacy records.
- Host-self-reviewed product knowledge is written under the product repo's `taste/`. Unresolved options and one-off reactions stay in harness memory.

### Pack read and write

- Inspect, read, validate, and write files inside `taste/`.
- `taste_record_signal` remains a legacy structured Decision writer. Routine learning is written to scoped checklists with `taste_pack_write`.
- `taste_part_state` remains for legacy structured Decision compatibility and diagnostics. It does not route checklist-based Packs; the host routes from the user's task and affected product surface, choosing Conformance, Expression, or a focused clarification as appropriate.
- Writes stay inside the Pack, reject symlink parents, and cap size at 256 KiB.

### Evaluation packets

- Fixtures store task, before, and after. The generator packet omits the expected after. The Judge packet includes one output, the expected after, and the rubric.
- Fixture lanes are still directory names `conformance` and `expression`. Those names are storage, not Pack modes.
- The synthetic smoke run in [validation-results.md](validation-results.md) checked the packet split. It is not evidence that Taste improves a real product.

### Harness workflows

- `taste-setup`, `taste-sweep`, `taste-design`, `taste-conformance`, `taste-expression`, `taste-pack`, and `taste-evaluate` describe when the harness should call which tool.
- Expression interviews in the harness conversation. Apply direct user corrections and disagreements, self-check the result, then update reusable checklist items without a separate review or promotion step.
- Explicit setup inspects repository structure first, chooses a bounded scope, and requires rendered evidence for visual claims. Parallelize only bounded parts of that scope when useful, then reconcile evidence and self-review before writing the Pack. Normal UI work never starts setup implicitly.
- `taste_mode_resolve` is still registered and tested. It is a deprecated helper and is not the ∞ rule.

## Explicitly out of this slice

- Hard CI gates, a Gate runner, or a required check on pull requests.
- A daemon, or Taste hosting the Critic or Eval Judge. The harness does that when it can.
- A specific product as a blocker. Any product repo is enough for the harness test in the README.
- Hard CI gates or a Gate runner inside Taste.
- A live install proof inside Cursor, Claude Code, or Codex. Automated tests cover the MCP process and Pack files. A person still has to run the harness script once.

## Checks that exist

`npm test` builds `dist/server.js` and covers manifest schema, Pack init, path confinement, legacy Pack validation, Decision write and derived part state, eval packet separation, and a stdio MCP client. `npm run validate:package` checks the Agent Plugins manifests, the Codex marketplace entry, Claude Code compatibility, and Skill frontmatter. Neither check installs the plugin into a GUI harness.
