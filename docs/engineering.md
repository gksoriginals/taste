# Engineering guide

This document describes the implementation in this repository. Product intent is in the [product brief](prd.md). Taste is a plugin and local MCP server; it does not host the coding agent or perform repository-wide inspection on its own.

## Architecture

```mermaid
flowchart LR
  User[User and product repository] --> Host[Cursor, Codex, or Claude Code]
  Plugin[Taste Skills and host adapters] --> Host
  Host -->|judgment, inspection, UI work| Repo[Product source and rendered UI]
  Host -->|Pack operations| MCP[Taste local stdio MCP server]
  MCP --> Pack[Product repository taste/ Pack]
  Host -->|evaluation fixture requests| MCP
```

The **host** owns the model, conversation, repository context, browser or computer access, delegation, implementation, checks, and self-review. Taste provides **Skills** that guide host behavior and an **MCP server** for bounded Pack and evaluation operations. The **Pack** is product-specific Markdown and JSON stored at `<product-repository>/taste/`.

Taste does not automatically inspect the UI, read conversation history, run product checks, browse the product, or judge whether a user comment is reusable. Skills direct the host to do those things with available repository and harness tools. The host then passes evidence and Pack content to MCP tools.

## Task routing and learning

The host routes from the user's request and affected product surface:

- Apply relevant product guidance for established behavior (Conformance).
- Explore a new direction, unsupported surface, or correction (Expression), while retaining any applicable guidance.
- Ask a focused question when a material intent or scope choice cannot be resolved from the repository and conversation.

These are behavior labels, not persisted Pack modes. Taste has no persisted task-routing state.

During normal UI work, a clear reusable correction can become a scoped checklist lesson after the host applies and self-checks it. If the surface has no Pack yet, the host may initialize the minimal scaffold, replace starter content with evidence-backed surface guidance, and mark only that surface `usable_partial`. This does not start a broad sweep. One-off or unresolved feedback remains task-local. There is no separate approval or promotion step for this path.

Explicit `/taste-setup` or invocation of the `taste-setup` Skill is the broader repository workflow. The host inventories the repository before choosing scope, inspects a bounded selection of rendered UI and source as available, and creates or selectively refreshes guidance. The host distinguishes evidence types, records coverage and inaccessible areas, self-checks its work, validates, and reports limits. Taste supplies the workflow and file tools; it does not perform the sweep itself.

## Pack structure and lifecycle

There is one Pack per product repository. Its contents are product-specific; Taste does not impose universal reference categories. A typical Pack has a `manifest.json`, README, and product-design entry Skill, plus only the references, checklists, metadata, examples, or evaluation fixtures that the product needs.

The manifest tracks setup readiness separately from coverage. Current statuses are:

- `in_progress`: setup is unfinished; guidance is not generally usable.
- `usable_partial`: one or more explicitly recorded surfaces have sufficient guidance; apply only to those covered surfaces.
- `complete`: the confirmed setup scope and its required coverage target have been met and validation passes.

Coverage entries identify the app/surface/journey, status, typed evidence with a checked date, and guidance files supported by that evidence. A Pack can therefore be usable for one surface while other surfaces remain blocked or uninspected. Source-only guidance may satisfy the default `source_reviewed` policy if it is actionable and clearly says visual behavior is unverified. A repository can configure `rendered_flow` when a rendered representative journey is required before a surface is usable.

Initialization creates a non-overwriting shell. It is not a completed Pack. The host must replace generic starter text with product-specific guidance before reporting usability. Refresh should inspect existing content first and preserve supported material. Interrupted setup must retain files and an accurate incomplete status so the host can resume.

## MCP server

`src/server.ts` creates the MCP server and registers tools. `src/core/pack.ts` owns Pack path safety, file operations, manifest parsing, lifecycle inspection, validation, and evaluation fixture access. `src/core/diagnostics.ts` emits opt-in operational diagnostics.

Current tool groups:

| Group | Tools | Role |
| --- | --- | --- |
| Pack operations | `taste_pack_initialize`, `taste_pack_inspect`, `taste_pack_read`, `taste_pack_write`, `taste_pack_validate` | Create a non-overwriting shell; inspect status; read/write Pack files; validate structure and evidence metadata. |
| Evaluation fixtures | `taste_eval_list_fixtures`, `taste_eval_get_generator_case`, `taste_eval_get_judge_packet` | Provide fixture inputs and a separate judge packet. The host runs generator and judge work; packet separation is workflow guidance, not an access-control boundary. |

All Pack file paths are resolved within the target `taste/` directory. The server does not write product UI, harness instructions, or host configuration. Pack validation checks structure and declared evidence relationships; it does not judge the quality of product design or verify the truth of host-reported observations.

## Skills and packaging

The repository's `skills/` directory contains seven workflow Skills:

- `taste-design`: entry routing for UI work.
- `taste-conformance`: applying established Pack guidance.
- `taste-expression`: new directions, gaps, and corrections.
- `taste-setup`: explicit repository setup or refresh.
- `taste-sweep`: bounded product inspection during setup.
- `taste-pack`: Pack inspection, validation, and maintenance.
- `taste-evaluate`: evaluation and calibration workflow.

Root plugin metadata and harness-specific adapter files expose the same Skills and bundled server to supported hosts. Cursor has a slash command for setup. Adapters are packaging, not separate implementations. Consult the manifests and [plugin development guide](plugin-development.md) for exact host configuration; host formats can change.

## Evaluation and evidence

The evaluation tools separate fixture generation inputs from expected results and the judge packet. They help the host compare outputs with and without guidance and score criteria independently. Taste does not run the model calls or supply an authoritative judge. A synthetic one-task run is recorded in [validation results](validation-results.md); it found a guidance-induced mismatch and does not establish product-level improvement.

The design rationale draws on published practitioner systems: focused on-demand Skills from [Anthropic](https://claude.com/resources/articles/improving-frontend-design-through-skills), task/surface routing and repository-owned guidance from [Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel), knowledge and evaluation patterns from [LangChain](https://www.langchain.com/blog/design-agent), and scenario-specific design rules with rationale from [Emil Kowalski](https://emilkowal.ski/ui/agents-with-taste). These are implementation references and case studies, not controlled evidence that Taste works. Taste-specific statuses, manifest fields, MCP tools, and host self-review are product choices that require evaluation.

## Development

Node.js 20 or later is required. Install dependencies with `npm ci`. Common checks:

```sh
npm run build
npm run typecheck
npm test
npm run validate:package
```

The build commits `dist/server.js` for plugin installs. `npm test` rebuilds it and runs the automated test suite. See [Contributing](../CONTRIBUTING.md) for the contributor workflow.
