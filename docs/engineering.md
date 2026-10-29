# Engineering

**Draft architecture for the product (v0) · Oct 29, 2026 IST**

## Status and scope

This is the architecture of Taste, the product we are building. Taste is a plugin for an existing coding-agent harness. The draft is not presumed final. More research may refine it. It is not a locked API.

The source articles (LangChain, Anthropic, Vercel, OpenAI, Emil) stay in full as the starting base. They are proof-of-concepts. This doc re-homes them under Taste's names. The [Vercel product-design tree](https://vercel.com/blog/teaching-agents-product-design-at-vercel) is the default on-disk **Pack adapter**, not the domain model.

**Product source of truth:** the [Google Doc one-pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit), mirrored in [docs/prd.md](prd.md). If this file and the Doc disagree about the product, the Doc wins.

**Audience:** Gopi and Dev for engineering. North for product alignment only.

**Hard goal:** from what a product has shipped, extract its taste across every design angle so any coding harness, given a PRD and the Taste Pack, first-passes UI you would merge. The abstract set of angles stays open and gets clearer as Packs are built. See the [PRD](prd.md).

Two mode names are first-class, from the PRD:

- **Conformance** — match the judgment the product has already shipped.
- **Expression** — invent or extend taste. Deferred. Omnipresent later.

This repository stays docs-only. The schemas below are the product's domain model, written down so Pack files and harness tools have stable inputs and outputs. They are not implemented code. No application code, package manifest, MCP server, or skill files in this repo. The Pack adapter is a layout for a **target product repo**. MCP tool names and skill roles in this doc are contracts for the harness integration, not code to add here.

Read [System architecture](#system-architecture) for how Taste sits on a harness, then the [Abstraction stack](#abstraction-stack) for what a builder creates at each level. Domain schemas, the harness integration table, the Vercel Pack adapter, Conformance and Expression, gates, Critique, product evals, and the improve loop follow. Dependencies run one way, so a skill, a tool, an adapter, or a dogfood binding can be replaced on its own.

## System architecture

Taste plugs into a coding harness the user already runs. The harness owns the agent loop, the planner, the models, file and shell tools, the skill loader, the MCP client, subagents, `AGENTS.md` and rules, and linters or CI. Taste is the plugin surface those primitives load.

### What Taste is

```
┌──────────────────────────────────────────────────────────┐
│  Coding harness (Cursor / Claude Code / Codex / …)        │
│  owns: loop, planning, models, edit/shell tools,          │
│        skill loader, MCP client, subagents, CI hooks      │
└────────────────────────────┬─────────────────────────────┘
                             │ loads Pack · calls MCP ·
                             │ spawns Critic subagent
┌────────────────────────────▼─────────────────────────────┐
│  Taste (plugin surface)                                   │
│  • Pack in target product repo (skills, wiki, decisions)  │
│  • MCP tools (load_pack, list_decisions, run_gates, …)    │
│  • Pack-maintainer skills: Sweep · Learn · Interview      │
│  • Critic brief → harness subagent                        │
│  • Gates as linters/CI                                    │
└────────────────────────────┬─────────────────────────────┘
                             │ guides / checks
┌────────────────────────────▼─────────────────────────────┐
│  Target product UI work (e.g. HelloAlly ally-platform)    │
│  PRD + Pack → first-pass mergeable UI (Conformance)       │
└──────────────────────────────────────────────────────────┘
```

The middle box is the [L3 harness integration surface](#l3-harness-integration-surface) plus Pack files from the [L2 adapter](#l2-pack-on-disk-adapter). The bottom box is [L4](#l4-dogfood-bindings) when the target repo is a dogfood product. [L0](#l0-principles) and [L1](#l1-domain-schemas) are not boxes. L0 is the constraints. L1 is the schemas.

Taste does not replace the harness loop. It does not host its own runtime. It is context, tools, checks, pack-maintainer skills, and a Critic subagent brief.

### How it works

Conformance has three flows: build the Pack, day-to-day UI, and Learn. Expression is a later flow. All of them run inside the host harness.

**A. Build / refresh Pack (Conformance).** The user asks the harness to Sweep a product. The Sweeper skill reads shipped UI and git history, with the user granting that access. It writes proposed Decisions, Exemplars, CoverageGaps, and candidate Gates into the Pack. A human accepts. PackManifest `mode` is `conformance`.

**B. Day-to-day UI generation (Conformance).** The harness starts a UI task. The repo `AGENTS.md` triggers the Taste skill. The skill loads the Angles and Decisions for that surface. The coding agent implements. The harness runs Gates through the repo linter, CI, or MCP `run_gates`. The harness spawns a Critic subagent with the Pack brief. The Critic returns CriticFindings. The agent fixes, or a human merges.

**C. Learn.** A human or Critic correction lands mid-turn. The Learner records a MemoryLesson or a proposed Decision in that same turn (fast). Later it promotes the lesson into a Skill or the Wiki (slow).

**D. Expression (later).** Pack mode or the task mode is `expression`. The harness runs the Interviewer skill and applies ExpressionPriors. The flow stays harness-hosted. OpenAI, Emil, and Anthropic priors apply until the design locks and Taste returns to Conformance.

## Abstraction stack

A builder implements Taste one level at a time. Each level states what it is, which artifacts live there, who owns them, what to edit, which harness primitive it uses, and which updates leave the neighboring levels intact.

L0 is principles only. L1 is domain schemas only. L2 maps those types to files. L3 is the harness integration surface. L4 is a dogfood binding and is not part of L1.

```
L0 Principles
  constrain every level below. They are not records.
L1 Domain schemas
  ↑ read and write types only
L3 Harness integration surface
  Sweep, Learn, Interview skills; Critic brief; Evaluate;
  Gate runner; Pack loader; MCP tools
  ↑
L2 Pack on-disk adapter
  how Pack loader reads files, where Gate text lives, where review cites
  ↑
Harness (Cursor / Claude Code / Codex / …) executes L3
L4 dogfood (Ally now, omnipresent later) is an edge binding. It is not in L1.
```

Dependencies run one way. Pack schemas do not mention Ally or a harness. The harness integration depends on Pack schemas only. The harness and the dogfood sit at the edge. Replacing the Critic protocol does not rewrite the Sweeper skill. Replacing the linter engine does not rewrite Decision records.

### L0. Principles

#### What it is

The architecture constraints every other level has to obey.

#### What lives here

Written principles only. No schemas, no files, no skills, no MCP tools, no CI jobs.

- The harness owns the loop: planning, models, tools, and the PR workflow.
- Taste is a plugin on that harness: Pack files, MCP tools, skills, gates, and a Critic brief. It supplies context, tools, and checks.
- Shipped wins over a stated preference that conflicts with it. A shipped flaw is not a Decision to copy.
- Conformance is the dogfood mode. Expression waits.
- Judgment stays in prompts and in Decision prose. Invariants that must always hold live in code, as Gates. Compensating rules expire when models improve. The principles stay.
- Evaluate scores rule correctness separately from similarity to shipped code.
- Generate–review means the coding agent generates and the Critic subagent reviews that output. Earlier notes called this GAN-inspired. That metaphor is historical only. The message protocol is still a placeholder.
- Taste is not an agent runtime, not a component library, and not a design-system product. OpenSignal does not own design judgment. Taste does not couple to OpenSignal.

That split follows the PRD and the [Content Studio](https://www.langchain.com/blog/design-agent) lesson that taste is the designers' judgment written into skills and checks, while the harness owns the loop. Content Studio's sandbox, Slack UX, and media tooling are that product's harness. Taste does not rebuild them.

These are draft product assumptions. They are not a final lock.

#### Who owns it

The Taste product architecture, in this document. The harness does not define these principles. A dogfood product does not override them.

#### How a builder works at this level

Read this list before adding a schema field, a skill, an MCP tool, or a dogfood binding. Edit L0 only when the product architecture itself changes. Leave L1 field names, L2 paths, L3 tool names, and L4 repo paths alone when you are only restating a principle.

#### How it hooks the harness

It does not register anything. It names the primitives later levels may use — skill loader, MCP client, subagent API, linter and CI, `AGENTS.md` — and it keeps the agent loop in the harness.

#### Stability

A principle change is a product architecture change. It may force edits at L1–L4. A pack update or a dogfood binding leaves L0 as written.

### L1. Domain schemas

#### What it is

The schemas for Taste's nouns, with no product and no harness baked in.

#### What lives here

Field tables only. The full tables, including notes, are the [Domain model](#domain-model). No file paths. No Ally fields. No Cursor, Claude Code, or Codex fields. No MCP handlers. No CI config.

| Schema | Fields a builder stores |
| --- | --- |
| Decision | id, angle_id, mode, status (`proposed`, `accepted`, `rejected`), scope, statement, rationale, evidence_ids, exceptions, bad_example, good_example, assumptions, open_decisions |
| Angle | id, name, mode, summary, decision_ids, skill_id, wiki_refs, coverage_gap_ids |
| Evidence | id, kind (`pr`, `commit`, `path`, `review`, `preview`), locator, note |
| Exemplar | id, title, decision_ids, known_flaws, evidence_ids, holdout |
| CoverageGap | id, angle_id, missing, why_it_matters |
| Gate | id, decision_id, engine, check, why, fix, autofix |
| EvalFixture | id, mode, before_ref, after_ref, exemplar_id, rubric_id, holdout, requires_prod_data, requires_git_history |
| Rubric | id, dimensions (id + question). Starting set: mergeable_first_pass, no_long_design_prompt, no_reteach_per_screen, rule_correctness, similarity_to_shipped, skill_loaded |
| JudgeResult | fixture_id, run (`with_skill` or `without_skill`), scores, skill_loaded, notes |
| MemoryLesson | id, loop (`fast` or `slow`), statement, evidence_ids, target, status (`captured`, `promoted`, `expired`) |
| CriticFinding | id, severity (`P0`–`P3`), location, verification (`source`, `rendered`, `unverified`), source_id, user_consequence, smallest_fix |
| PackManifest | product, mode, adapter, and the id lists for angles, decisions, exemplars, coverage gaps, gates, skills, wiki refs, eval fixtures, expression priors |
| Skill | id, job, when_to_use, when_not_to_use, angle_ids, wiki_refs |
| Router | id, rows of `{ ask, skill_id }` |
| Wiki | id, facts, linked_from |
| ExpressionPrior | id, source (`anthropic`, `openai`, or `emil`), statement, applies_when `expression`, subordinate to a Conformance Pack when one exists |

`mode` is `conformance` or `expression` on every record that has one.

#### Who owns it

The Taste product. Target product repos store instances of these types. The harness does not define them.

#### How a builder works at this level

Add a field only when every Pack needs it, and add it on the schema in [Domain model](#domain-model). Leave file paths, linter engines, skill prose, and repo names out of the schema. Ally ids, component names, and harness vendor APIs do not belong on these records. When the work is a directory layout, that is L2. When the work is a tool or skill that reads these records, that is L3.

#### How it hooks the harness

It has no harness registration. L2 files and L3 tools are how a harness sees these records. The harness receives Pack files and tool results. It does not import an L1 type from this repo.

#### Stability

Schemas stay stable across pack updates and dogfood bindings. Adding a field is a product change, and existing records stay readable. Swapping a Critic model, a gate engine, or the Ally repo does not change these fields.

### L2. Pack on-disk adapter

#### What it is

The mapping from L1 types to files in a target product repo.

#### What lives here

The default adapter id is `vercel-product-design`. It is the starting proof-of-concept, specified file for file in [Pack on-disk adapter](#pack-on-disk-adapter). Concrete artifacts in the **target product repo**:

| Artifact | Path |
| --- | --- |
| Skill-loader trigger | Repo `AGENTS.md` |
| Router and entry Skill | `.agents/skills/product-design/SKILL.md` |
| Skill load order and governance | `.agents/skills/product-design/AGENTS.md` |
| Angles, Decisions, Wiki facts | `.agents/skills/product-design/references/*.md` |
| CoverageGap list | `.agents/skills/product-design/references/coverage-gaps.md` |
| Exemplars | `.agents/skills/product-design/exemplars/pr-{name}.md` |
| Gates | Rules in the target repo's existing linter. The PoC records them as Gates with `engine: eslint`. |
| EvalFixture index | `tooling/scripts/evals/fixtures.json` |
| Rubric checklist for those fixtures | `tooling/scripts/evals/rules-checklist.json` |
| Fixture before / after states | `tooling/scripts/evals/<fixture>/before/` and `after/` |

Also here, as adapter prose rather than L1 fields: the trigger paragraph, the adapter request modes inside `SKILL.md` (Shape, Implement, Review, Copy, Harden), the decision-authority order, and the Decision template. Adapter request modes are Vercel workflow verbs. They are not Conformance and Expression.

This docs repo does not contain that tree.

#### Who owns it

The Taste product owns the adapter contract, written in this doc. The target product repo owns the files once they are written. The harness owns the skill loader that reads them.

#### How a builder works at this level

Create the tree in the target product repo, or add another adapter id that stores the same L1 records under different paths. Edit paths and trigger prose here. Leave L1 field names as they are. Do not rename a field to match a filename. Do not put Ally-only directories inside `vercel-product-design`. Do not treat Shape, Implement, Review, Copy, or Harden as the Taste mode.

#### How it hooks the harness

Repo `AGENTS.md` is the trigger the harness already reads on every task. The skill loader loads `.agents/skills/product-design/SKILL.md` on demand. References and exemplars are context files that skill links to. Eval fixtures are files a CI job or an agent run can read. Lint rule files sit where that repo's linter already looks. The choice of engine is the L3 gate runner. L2 only records which file holds the check.

#### Stability

A new adapter may store the same types. A path change is an adapter change: `PackManifest.adapter` changes, and L1 fields do not. A dogfood binding picks a repo and a surface. It does not fork this contract.

### L3. Harness integration surface

#### What it is

The Taste pieces that plug into harness primitives.

#### What lives here

Skills, MCP tool contracts, a subagent brief, and CI or linter jobs. The read/write table, the business rules, and the tool stubs are in [Harness integration](#harness-integration).

- Pack-maintainer skills: Sweep (Sweeper), Learn (Learner), Interview (Interviewer, Expression only).
- Router and specialist Skills, as `SKILL.md` bodies the skill loader reads.
- Critic brief for a harness subagent. The brief is Pack content. The subagent is the harness's.
- MCP stubs: `load_pack`, `list_decisions`, `get_angle`, `load_skill`, `run_gates`, `record_correction`, `list_coverage_gaps`.
- Gate runners as repo linters and CI, and as MCP `run_gates`.
- Pack loader as the `load_pack` tool or as a skill preamble that resolves a PackManifest from L2 paths.
- Evaluate as an offline run or a CI job: fixtures in, JudgeResult out. It is a product capability of the Pack. It is not a separate agent.

The stubs in this repo are the documented contracts (name, inputs, outputs). There is no MCP server package and no `SKILL.md` tree checked in here.

#### Who owns it

The Taste product owns the contracts: this doc, the Pack templates in the L2 layout, and the MCP stubs. The host harness executes all of them.

#### How a builder works at this level

Add or replace one skill or one MCP tool without rewriting L1 schemas or the L2 on-disk adapter contract. Document what the new role reads and writes, using L1 type names. Leave Decision and Angle fields alone. Leave L2 paths alone unless the adapter itself is the change. Do not teach the gate runner to rewrite a Decision statement. Do not put Ally flow names into the skill contracts.

#### How it hooks the harness

- Skill loader discovers `SKILL.md` for the Router, the specialist Skills, and Sweep, Learn, and Interview.
- MCP client registers the tools. The harness calls them. Taste does not wrap the call in its own loop.
- Harness subagent API runs the Critic on a bigger model with the Pack brief.
- Shell and CI run gates.
- The `AGENTS.md` trigger is L2. L3 skills run after it has fired.
- When a fixture sets `requires_prod_data` or `requires_git_history`, the harness asks the user. Taste does not collect that access.

#### Stability

Swap the Critic model or the gate implementation without changing Decision or Angle schemas. Replace the Critique message shape, the pass count, or the linter engine without a Sweeper change. Replace one skill or MCP tool without rewriting the others. A pack update changes records, not these roles.

### L4. Dogfood bindings

#### What it is

An edge binding that points the same product at a real repo and a first surface.

#### What lives here

A repo path and a surface name. No new schemas. The table is repeated, with the current choice of surface, in the [dogfood appendix](#dogfood-appendix).

| When | Repo and surface | Mode | What the harness runs |
| --- | --- | --- | --- |
| Now | HelloAlly ally-platform. First pain: flow and interaction, the first surface Sweep should look at. | Conformance | Sweeper skill, then day-to-day UI skills, Gates in that repo's linter and CI, Critic subagent, Evaluate against that Pack. |
| Later | omnipresent | Expression | Interviewer skill and ExpressionPriors. |

#### Who owns it

The dogfood product owns the repo, the shipped UI, and the human who accepts or rejects Decisions. Taste does not own Ally. The harness is whichever coding harness that team already runs.

#### How a builder works at this level

Pass the repo path into Sweep and name the first surface. Wire that repo's `AGENTS.md`, linter, and CI to the L3 roles. Leave L1, L2, and L3 contracts untouched. Do not add Ally fields to Decision, PackManifest, or MCP tool inputs. Do not copy Ally component names into the default adapter. Leave Expression on omnipresent unwired until that product is in play.

#### How it hooks the harness

The same hooks as L3, aimed at that repo. `AGENTS.md` in ally-platform, the skill loader, the MCP client, the Critic subagent, and that repo's lint CI. Taste does not install a second runtime beside the dogfood harness. The same hooks apply to omnipresent when Expression starts.

#### Stability

Changing the dogfood repo or the first surface is a dogfood binding change. It does not change L1 schemas, the default adapter, or the skill and MCP contracts. Another product can take the Ally seat without a schema migration.

## Domain model

Names used from here on. Vercel filenames appear again only in the [Pack adapter](#pack-on-disk-adapter).

| Name | Meaning |
| --- | --- |
| Conformance | Match judgment already shipped. |
| Expression | Invent or extend taste. Deferred. |
| Pack | Portable taste artifact in a target product repo. |
| Angle | One design angle (typography, flow, interaction, copy, …). The set is open. |
| Decision | One observable encoded judgment. |
| Evidence | Pointer to shipped proof: PR, commit, path, review, or preview. |
| Exemplar | Shipped example, including decisions worth repeating and known flaws. |
| CoverageGap | A missing standard. |
| Gate | A deterministic check (linter or other code). |
| Skill | How to do a job. Job-scoped. Loaded on demand. |
| Router | The Skill whose body is mostly a table from an ask to a specialist Skill. |
| Wiki | Shared craft and product facts. Skills link to it. They do not copy it. |
| MemoryLesson | A captured correction. Fast: same turn. Slow: promoted later into a Skill, Wiki, or Decision. |
| EvalFixture | A before state, an after state, and the Rubric that judges an edit. |
| Rubric | The dimensions a judge scores. |
| JudgeResult | The outcome of Evaluate on one fixture run. |
| CriticFinding | One review finding from Critique. |
| PackManifest | The index of a Pack: ids, mode, and which adapter stores it. |
| ExpressionPrior | Guidance for Expression only (anti-slop, aspect rules). Subordinate to a Conformance Pack when one exists. |

Schemas are the product's domain model. They are not a shipped API. `mode` is `conformance` or `expression` on every record that has one.

### Decision

| Field | Content |
| --- | --- |
| id | Stable id. Adapter example: `decision/destructive-names-action`. |
| angle_id | Angle it belongs to. |
| mode | `conformance` or `expression`. |
| status | `proposed`, `accepted`, or `rejected`. Stays `proposed` until a human accepts it. |
| scope | Where it applies. |
| statement | The observable rule. Adjectives do not qualify. |
| rationale | Why. |
| evidence_ids | Evidence pointers. |
| exceptions | When it does not apply. |
| bad_example | |
| good_example | |
| assumptions | |
| open_decisions | |

The on-disk serialization in the default adapter is the Vercel decision record in [First surface](#first-surface).

### Angle

| Field | Content |
| --- | --- |
| id | `angle/{name}`. |
| name | Search list from the PRD, not a closed set: style, fonts and typography, themes and tokens, UX, interaction, flow, copy, and more. |
| mode | Which mode this angle file is being filled for. |
| summary | What this angle means in this product. |
| decision_ids | Decisions on this angle. |
| skill_id | Specialist Skill, when one exists (Emil: one file per aspect). |
| wiki_refs | Shared facts this angle links to. |
| coverage_gap_ids | What is still missing. |

### Evidence

| Field | Content |
| --- | --- |
| id | |
| kind | `pr`, `commit`, `path`, `review`, or `preview`. Vercel intake also preserves Slack and Figma links; store those as `review` or `preview` with the URL in `locator`. |
| locator | URL, sha, or path. |
| note | What this pointer is evidence of. |

### Exemplar

| Field | Content |
| --- | --- |
| id | Adapter file: `exemplars/pr-{name}.md`. |
| title | |
| decision_ids | Decisions worth repeating. |
| known_flaws | What the shipped code gets wrong. Similarity to this file is not success. |
| evidence_ids | |
| holdout | When true, expected edits stay out of the Skill text. |

### CoverageGap

| Field | Content |
| --- | --- |
| id | |
| angle_id | |
| missing | The decision or evidence that is absent. |
| why_it_matters | |

### Gate

| Field | Content |
| --- | --- |
| id | |
| decision_id | The Decision this check enforces. The Decision does not name a linter engine. |
| engine | Replaceable. The Vercel PoC uses ESLint. |
| check | What code identifies. |
| why | Why the pattern is a problem. |
| fix | Concrete fix. Empty when the right output is a warning. |
| autofix | Whether a safe migration may rewrite the code. |

### EvalFixture

| Field | Content |
| --- | --- |
| id | |
| mode | `conformance` or `expression`. |
| before_ref | Before state. |
| after_ref | Shipped or expected after state. Hidden from the Skill when `holdout` is true. |
| exemplar_id | |
| rubric_id | |
| holdout | |
| requires_prod_data | The harness may ask the user. Taste does not collect it. |
| requires_git_history | Same. |

### Rubric

PRD success signals are dimensions. Vercel's two scores stay separate dimensions. Gate pass rate is an optional measure, not a required dimension.

| Field | Content |
| --- | --- |
| id | |
| dimensions | Each dimension has an id and a question. Starting set below. |

| Dimension id | Question | Source |
| --- | --- | --- |
| mergeable_first_pass | Is the first pass UI you would merge? | PRD |
| no_long_design_prompt | Did the run need a long design prompt? | PRD |
| no_reteach_per_screen | Did the run need re-teaching on this screen? | PRD |
| rule_correctness | Did the edit follow the Decisions and Gates? | Vercel |
| similarity_to_shipped | How close is it to the shipped result? Scored separately. A high score is not success when `known_flaws` says to improve the shipped code. | Vercel |
| skill_loaded | Did the agent load the Skill? Separate from whether it followed a rule. | Vercel trigger eval |

### JudgeResult

| Field | Content |
| --- | --- |
| fixture_id | |
| run | `with_skill` or `without_skill`. |
| scores | One value per Rubric dimension. |
| skill_loaded | |
| notes | |

### MemoryLesson

| Field | Content |
| --- | --- |
| id | |
| loop | `fast` or `slow`. |
| statement | The correction or preference. |
| evidence_ids | |
| target | Skill, Wiki, or Decision id to promote into. Empty while pending. |
| status | `captured`, `promoted`, or `expired`. |

Fast: write it in the same turn the person states it. Slow: promote it later if it holds. Content Studio runs promotion on a weekly pass. The cadence is not locked. Shared standards take precedence over a personal preference.

### CriticFinding

| Field | Content |
| --- | --- |
| id | |
| severity | `P0`, `P1`, `P2`, or `P3` (Vercel labels, starting scale). |
| location | File, line, or rendered location. |
| verification | `source`, `rendered`, or `unverified`. |
| source_id | Decision, Skill, or Wiki the finding cites. |
| user_consequence | |
| smallest_fix | |

### PackManifest

The envelope the harness integration reads. No Ally-specific fields. No harness-specific fields.

| Field | Content |
| --- | --- |
| product | Display name of the target product. Free text. |
| mode | `conformance` or `expression`. |
| adapter | Default: `vercel-product-design`. |
| angle_ids | |
| decision_ids | |
| exemplar_ids | |
| coverage_gap_ids | |
| gate_ids | |
| skill_ids | Includes the Router. |
| wiki_refs | |
| eval_fixture_ids | |
| expression_prior_ids | Empty on a Conformance Pack. |

```json
{
  "product": "",
  "mode": "conformance",
  "adapter": "vercel-product-design",
  "angle_ids": [],
  "decision_ids": [],
  "exemplar_ids": [],
  "coverage_gap_ids": [],
  "gate_ids": [],
  "skill_ids": [],
  "wiki_refs": [],
  "eval_fixture_ids": [],
  "expression_prior_ids": []
}
```

### Skill, Router, Wiki

| Type | Essential fields |
| --- | --- |
| Skill | id, job, when_to_use, when_not_to_use, angle_ids, wiki_refs. Description reads like a routing rule, including when not to use it. |
| Router | id, rows of `{ ask, skill_id }`. One table. Specialist craft is written once. |
| Wiki | id, facts, linked_from. Skills link here. A font rule changes once. |

## Harness integration

The harness already has an agent loop, a planner, models, file and shell tools, a skill loader, an MCP client, subagents, `AGENTS.md` and rules, and linters or CI. Taste plugs into those primitives. The pieces below are skills, subagents, MCP tools, linters, and Pack files.

Two modules. The Pack is data the skill loader reads. The harness integration surface is the set of skills, tools, briefs, and checks that read and write that data. This repo documents both. It does not ship them as binaries.

| Module | Owns | Does not own |
| --- | --- | --- |
| Pack | L1 records and, through an adapter, the files that store them. | The model loop, the linter binary, the Critic protocol, Ally paths. |
| Harness integration | Sweep, Learn, Interview, Critique, Evaluate, the gate runner, and the Pack loader, as skills, MCP tools, a subagent brief, and linters. | Each other's internals. The harness loop. |

### What plugs in where

| Taste capability | What it is in harness terms | Who runs it |
| --- | --- | --- |
| Pack | Repo files the skill loader reads (skills, wiki, references, exemplars, `AGENTS.md` trigger) | Harness skill and context loader |
| Router + Skills | Agent Skills (`SKILL.md`) loaded on demand for UI work | Coding agent in the harness |
| Wiki / Decisions / Angles | Context files and references the skills link to | Loaded by skills |
| Gates | Deterministic checks: repo linters, CI, and/or MCP `run_gates` | Harness shell, CI, or MCP |
| MCP server | Tools registered on the harness MCP client. Documented stubs only, in this repo. | Harness tool calls |
| Sweeper | A skill, or a dedicated agent turn, the harness runs to extract a Pack from shipped UI | Coding agent |
| Learner | A skill or hook that records corrections into the Pack (fast) and promotes them later (slow) | Same harness session, or a scheduled agent turn |
| Interviewer | A skill the harness runs for Expression (greenfield) | Harness, when mode is Expression |
| Critic | A harness subagent on a bigger model, with the Critic skill and brief from the Pack. Generate–review. | Harness subagent API |
| Eval fixtures / Rubric / Judge | Product evals. An offline run or a CI job measures whether the Pack changed harness UI work. | Harness or CI |
| Pack loader | Resolves a PackManifest from on-disk adapter paths | MCP `load_pack`, or a skill preamble |

### What each role reads and writes

| Role | Harness primitive | Reads | Writes |
| --- | --- | --- | --- |
| Pack loader | MCP `load_pack`, or a skill preamble. The only role that resolves L2 paths. | Adapter files | PackManifest and the records it indexes |
| Sweep | Sweeper skill, or a dedicated agent turn | Target repo, and Evidence the harness can reach after the user approves access | Proposed Decisions, Evidence, Exemplars, CoverageGaps, candidate Gates |
| Learn | Learner skill or hook, in the same session or on a schedule | Corrections, intake packets | MemoryLesson (`fast` immediately). Later: a promoted Skill, Wiki, or Decision |
| Interview | Interviewer skill. Runs only when mode is `expression`. | Greenfield intent | Expression Decisions and ExpressionPriors, status `proposed` |
| Critique | Critic brief. Harness subagent on a bigger model. | Generator output, Pack, Rubric | CriticFindings. Edits only when the request mode asks for edits |
| Evaluate | Offline run or CI job. A judge step in the harness. | EvalFixture, Rubric, with-skill and without-skill runs | JudgeResult |
| Gate runner | Repo linter, CI, and/or MCP `run_gates`. The only role that knows an engine. | Gate records, the diff | Pass, fail, or warning per Gate. Decision records stay untouched |

Interview is the Expression skill. It stays off the Conformance dogfood path.

Business rules, as the behavior of these roles:

- Shipped wins over a conflicting stated preference. Sweep records the shipped pattern as Evidence. A preference that contradicts it does not become an accepted Decision.
- A universal rule needs human acceptance. Sweep and Learn write `status: proposed`.
- One screenshot, one shipped file, or one reviewer comment does not become a Decision by itself.
- Measurable invariants become Gates. Judgment stays on the Decision and in the Skill prose.
- After a model upgrade, delete compensating rules. Mark those MemoryLessons or Decisions `expired`. Keep the principles.
- Critique's protocol can change without a Sweeper change. The Gate engine can change without a Decision change.

### MCP tool stubs

Documented names for L3. This repo does not implement them. The list is a starting stub, not a locked tool surface.

| Tool | In | Out | Role |
| --- | --- | --- | --- |
| `load_pack` | adapter id, repo root | PackManifest | Pack loader |
| `list_decisions` | angle_id?, status?, mode? | Decision[] | Pack loader |
| `get_angle` | angle_id | Angle plus its Decision ids | Pack loader |
| `load_skill` | skill_id, or a Router ask | Skill body | Pack loader |
| `run_gates` | paths or diff | Gate results | Gate runner |
| `record_correction` | MemoryLesson fields (`loop: fast`) | MemoryLesson id, status `captured` | Learn |
| `list_coverage_gaps` | angle_id? | CoverageGap[] | Pack loader |

The harness calls these. Taste does not own the loop around them.

## Pack on-disk adapter

Default adapter id: `vercel-product-design`. Starting PoC, from [Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel). Three parts, as Vercel defines them: an agent skill, linters for clear rules, and a review loop that prepares guideline updates for a human.

This tree is how the Pack loader finds files. It is not the domain model. Another adapter may store the same L1 records under different paths.

Layout in the **target product repo**:

```
repository/
├── AGENTS.md
├── .agents/
│   └── skills/
│       └── product-design/
│           ├── AGENTS.md
│           ├── SKILL.md
│           ├── references/
│           │   ├── product-judgment.md
│           │   ├── interface-quality.md
│           │   ├── resilience.md
│           │   ├── surfaces.md
│           │   ├── surfaces-{surface}.md
│           │   ├── copy.md
│           │   ├── rules.md
│           │   ├── glossary.md
│           │   ├── patterns.md
│           │   └── coverage-gaps.md
│           └── exemplars/
│               └── pr-{name}.md
└── tooling/
    └── scripts/
        └── evals/
            ├── fixtures.json
            ├── rules-checklist.json
            └── <fixture>/
                ├── before/
                └── after/
```

Lint rules live in the target repo's existing linter (Vercel uses ESLint). They are Gate records with `engine: eslint`. This repo does not add a linter package. The directory name `product-design` is Vercel's. Keep it for this adapter so the published tree matches file for file.

| Path | L1 type |
| --- | --- |
| Repo `AGENTS.md` | Pack loader trigger. Not a domain type. Firm boundary: user-visible UI. |
| Skill-local `AGENTS.md` | Load order, validation, governance for the Router and Skills. |
| `SKILL.md` | Router plus the entry Skill. Adapter request modes live here. |
| `references/*.md` | Angle prose and Decision prose. Wiki facts live here too until an adapter splits them. Skills link to these files. They do not copy them. |
| `references/coverage-gaps.md` | CoverageGap list. |
| `exemplars/pr-{name}.md` | Exemplar. |
| Lint rules in the product linter | Gate. |
| `tooling/scripts/evals/fixtures.json` | EvalFixture index. |
| `rules-checklist.json` | Rubric checklist for those fixtures. |
| `<fixture>/before/`, `<fixture>/after/` | EvalFixture `before_ref` and `after_ref`. |

**Trigger.** Persistent repo instructions tell the coding agent when to load the Skill, what it covers, and what it skips. Vercel saw agents fail to invoke an available skill in 56% of cases in [separate Next.js evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals). Test the trigger separately from the guidance (`skill_loaded` on the Rubric).

Adapted from Vercel's trigger:

```
When shaping, editing, or reviewing user-facing UI,
load .agents/skills/product-design/SKILL.md.

Applies to:
- user-facing pages and components
- copy, interaction, accessibility, responsive behavior, and states

Skip:
- backend-only work with no user-visible effect
- telemetry, generated files, documentation, and marketing
```

Also skip console-only errors and tests with no shipped UI impact. The agent reports which surfaces and references it loaded. CriticFindings cite those sources.

**Adapter request modes.** These are Vercel's workflow verbs inside `SKILL.md`. They are not Conformance and Expression. Taste mode is `conformance` or `expression` on the Pack and on each Decision. The adapter mode only decides whether this turn may edit.

`SKILL.md` resolves the adapter mode before acting, so an audit does not become an edit and a copy pass does not become a redesign.

| Adapter mode | Required behavior |
| --- | --- |
| Shape | Frame the problem, alternatives, flow, states, acceptance criteria, and open decisions. Edit only when asked. |
| Implement | Resolve material product decisions, then make the smallest coherent change in scope. |
| Review | Inspect source and rendered evidence. Report findings. Edit only when asked. Critique runs here. |
| Copy | Edit user-facing language and the JSX that language requires. Report structural blockers without widening scope. |
| Harden | Keep the settled direction. Fix state, resilience, responsive behavior, accessibility, and finish. |

When the verb is ambiguous, use the narrowest mode. A URL, screenshot, route, or component sets scope. It does not by itself authorize edits.

**Routing.** The Router loads focused references for the task and the surface. Material changes load product-judgment and interface-quality. Copy, layout, interaction, and resilience each route to their own reference. A modal loads destructive-action patterns. A settings form loads labels, validation, and disclosure. Component APIs, design-system docs, and accessibility criteria stay with their owners. The Skill links to them.

**Decision authority.** Adopt Vercel's order. Rung 3 is the target repo's own canonical docs.

1. The user's explicit goal and constraints for this task.
2. Verified user and product evidence, including what shipped.
3. Repository-canonical guidance: `AGENTS.md`, component APIs, the product's design-system docs, routed Skills.
4. Accepted Decisions and Exemplars with stable Evidence.
5. Verified adjacent shipped patterns in the same product area.
6. General interface heuristics.

The PRD rule sits on rungs 2 and 5: when a stated preference conflicts with what shipped, shipped wins. The user's goal for the current task still comes first. Shipped code is Evidence of what exists. It becomes an accepted Decision only through the record in [First surface](#first-surface).

**Governance.** From Vercel's skill integrity. These are Learn and Sweep rules.

- Add or change a rule only after current-source verification and human acceptance.
- Record scope, rationale, evidence, exceptions, and a bad/good example.
- Prefer the narrowest destination: canonical source, routed reference, Exemplar, Gate or EvalFixture, or CoverageGap.
- Keep deterministic checks mechanical. Keep judgment in prose, with its evidence and its degree of freedom.
- Never promote one screenshot, one shipped file, or one reviewer comment into a universal rule by itself.

Stable ids point at the canonical source. Vercel's shape, which the adapter stores as a Decision:

```
rule/destructive-names-action
Source: copy.md > Actionable; verbs.md
Rule:   Destructive CTAs follow Verb + Noun.
        Never use Confirm, OK, or a bare verb.
```

That rule is their example of an observable Decision (`statement` plus `bad_example`). A target product's Decisions come from Sweep.

## Knowledge layers

[Content Studio](https://www.langchain.com/blog/design-agent) organizes an agent's knowledge into four functions. That is the v0 baseline, and it is how Pack records are grouped. [Anthropic's frontend-skills article](https://claude.com/resources/articles/improving-frontend-design-through-skills) is the other half of the baseline: Skills are dynamic context, loaded for the task, rather than a permanent system prompt.

| Layer | L1 types | Role |
| --- | --- | --- |
| Skills | Skill, Router | How to do a job. Job-scoped, behind a Router. A description reads like a routing rule, including when not to use it. |
| Wiki | Wiki | Shared craft and product facts: brand tokens, voice, patterns, product behavior. Skills link to the Wiki. They do not copy it. |
| Gates | Gate | Deterministic checks for anything measurable. |
| Memory | MemoryLesson | Fast: a correction is saved in the same turn. Slow: lessons that hold are promoted into a Skill, the Wiki, or a Decision. |

**Router.** The Router is mostly one table. Each row maps a kind of ask to the specialist Skill that handles it. Content Studio uses this so craft is written once and jobs compose. Taste uses the same shape. Adapter request modes are one kind of row: they keep a Review from turning into an edit.

**Wiki.** Shared facts live in one place. LangChain: "Rather than duplicating this information across skills, we link directly to the wiki." A font rule changes once. Every Skill follows the link. In the default adapter those facts sit in `references/` until a later adapter adds a `wiki/` path. The Wiki type does not change.

**Judgment in prompts, invariants in code.** Content Studio: "The order that must always hold lives in code, and the judgment stays in the prompt." They had described a required review order in instructions, and the agent skipped it. The order moved into code. Creative calls stayed in the prompt. Taste uses the same split. A Gate can count options, reject a nested modal, or flag a token that is off the product scale. Choosing the right object and consequence for a destructive action stays on the Decision, with its Evidence.

**Memory.** Fast loop: when someone states a rule or a correction, Learn writes a MemoryLesson in the same turn (`record_correction`). Slow loop: Learn later promotes evidence-backed lessons into the Skill, the Wiki, or a Decision. Content Studio runs that promotion on a weekly pass. The cadence is not locked. Shared standards take precedence over a personal preference. A company-channel or product rule follows the product voice.

**Rules expire.** Content Studio's [Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html): "Rules designed to compensate for a model's weaknesses become less useful as models improve." After a model upgrade, delete the compensating rules. Keep the design principles. Set the MemoryLesson or Decision status to `expired`, then re-run Evaluate. Their early `AGENTS.md` grew to 500K tokens. They cut it to a 200-line index. Taste keeps `AGENTS.md` as a bounded index. The 200-line figure is their practice, not a Taste cap. Growth goes into Skills and the Wiki.

**Altitude.** Anthropic, on prompting at the right altitude: avoid "low-altitude hardcoded logic like specifying exact hex codes and vague high-altitude guidance that assumes shared context." A Skill states why a Decision is right and the observable rule an agent can follow. Vague praise is not a Decision. A hex value the product did not ship is not a Decision. A token the product actually shipped is a Wiki fact, and a Gate may check it.

## Conformance path

Conformance is the mode where the Sweeper skill fills a Pack from a shipped product and the Learner skill keeps it current. Interview stays off this path. This is flow A and flow C in [System architecture](#system-architecture). Day-to-day UI generation on that Pack is flow B.

Sweep steps. The first-surface rule and the Decision template are in [First surface](#first-surface). The product names which surface is first. Ally's choice is in the [dogfood appendix](#dogfood-appendix), not in this procedure.

1. Pack loader reads the adapter. If the Pack is empty, PackManifest `mode` is `conformance` and `adapter` is `vercel-product-design`.
2. Pick one surface where the same review comments already repeat.
3. Collect shipped examples and reviews as Evidence (`pr`, `commit`, `path`, `review`, `preview`).
4. Write one Decision per observable judgment. Status `proposed`. Map it to the narrowest `references/` file. Add an Angle file only when no current reference is the right home.
5. Write Exemplars: decisions worth repeating, and known flaws.
6. Write CoverageGaps for anything still unstated. Leave them visible.
7. Propose a Gate only when the [gate decision tree](#gates-and-linters) says code can identify the failure. Otherwise the Decision stays prose.
8. Stop. A human accepts, rejects, or leaves each candidate pending.
9. Expand surface by surface. Re-run Evaluate when a Decision or Gate changes.

**Shipped, flaws, and preferences.** Three different facts:

- A stated preference that conflicts with the shipped product loses. Shipped wins.
- A shipped pattern is Evidence, with rationale if any exists, scope, exceptions, and known flaws. Exemplars document decisions worth repeating and mistakes to avoid.
- Similarity to shipped code is not the success score. Vercel: "Shipped code can contain a flaw that the agent should improve instead of reproduce."

**Learn loop.** Vercel's update loop is Learn. Cadence is not locked.

1. A collector gathers messages, links, and nearby context. It does not propose rules. Output is Evidence plus raw notes.
2. A separate judge groups the Evidence, verifies sources, and records open questions. Candidates stay pending. This judge is the intake judge, not Evaluate's JudgeResult.
3. A human accepts a candidate into the narrowest L1 destination:

| Vercel destination | L1 write |
| --- | --- |
| Agent guidance | Decision, Skill, or Wiki |
| Lint rule | Gate |
| Example | Exemplar |
| Eval | EvalFixture |
| Coverage gap | CoverageGap |
| No change | Nothing |

Evidence includes review comments, shipped pull requests, and previews. When Evidence is thin, record the code or commit needed to check it. The harness may ask the user for git history. See [Critique and Evaluate](#critique-and-evaluate).

The PRD angle list is Sweep's search list: style, fonts and typography, themes and tokens, UX, interaction, flow, copy, and more. The abstract set that holds across products stays open.

## Expression path

Expression is deferred. The harness skill is Interview. The dogfood surface is omnipresent, later. The lifecycle switch (Expression closed, design locked, Taste returns to Conformance) has no trigger yet. See the [PRD](prd.md). This is flow D. It stays off the Conformance dogfood path.

Until that trigger exists, ExpressionPriors are stored on the Pack and are not applied when PackManifest `mode` is `conformance`. When a Conformance Pack exists, it wins. OpenAI's own exception:

> Exception: If working within an existing website or design system, preserve the established patterns, structure, and visual language.

If the product shipped Inter, or a purple brand, Conformance keeps it. An ExpressionPrior rejects a default the product did not choose.

ExpressionPrior fields: `id`, `source` (`anthropic`, `openai`, or `emil`), `statement`, `applies_when: expression`, `subordinate_to: conformance pack when one exists`.

Generic UI is what the model emits when the Pack is silent. Anthropic and OpenAI are the starting ExpressionPriors for that failure. Emil is the starting shape for aspect Skills.

Anthropic, on an unguided landing page: models "almost always conform to Inter fonts, purple gradients on white backgrounds, and minimal animations." They name the cause [distributional convergence](https://en.wikipedia.org/wiki/Convergence_of_random_variables): sampling sits on the high-probability center of the training data. Their axes for steering are typography, color and theme, motion, and backgrounds. They also warn that a ban list can create a new local maximum (their example is Space Grotesk). Name the product's own alternatives. Do not swap one generic default for another.

OpenAI, on underspecified prompts: "models often fall back to high-frequency patterns from the training data." Their hard rules are ExpressionPriors: one composition in the first viewport, a hero budget, cardless by default, brand-first, expressive type, atmosphere instead of a flat field. The portable pack pattern is their [`frontend-skill`](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill). Those priors are subordinate to Conformance once a product Pack exists.

**Aspect Skills.** [Emil Kowalski](https://emilkowal.ski/ui/agents-with-taste): "My way of getting there is to create a skill file for each aspect of the interface. If you know what great feels like, describe the rules, then give them to your agents so they can follow them." Each file says why the choice feels right, then a strict table or flowchart so the agent does not invent a rule. His easing example: "This is strict so the agent doesn't have to guess or make up its own rules." He uses Anthropic's [skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) to package that.

Compose aspect Skills under the Router. The Router is job-scoped (the adapter modes, and later the product's real jobs). The aspect Skill is the specialist for one Angle: animation, typography, color, and the rest of the open set. Why and rules live there. Measurable slices graduate into Gates. Expression-only aspect guidance (distinctive type, anti-slop bans, hero budget) waits for greenfield or an unlocked design.

Anthropic's other point is the Conformance reading: a custom Skill can encode the organization's design system and component patterns as a reusable asset, loaded on demand. That is the product Pack. The generic frontend-aesthetics skill is not a substitute for it.

## Gates and linters

Use a Gate when code can identify the failure reliably. Leave the judgment on the Decision when it needs product context. The gate runner is a repo linter, a CI job, or MCP `run_gates`.

Vercel: "Code can count two or three static options, so a linter can recommend radio buttons. Naming the right object and consequence for a destructive action requires product context, so the skill handles it."

Their codebase examples illustrate that split. They are Vercel's Gates. A target product's Gates come from Sweep.

- Nested modals, which break focus, keyboard navigation, and layering.
- Radio buttons instead of a select for two or three static options.
- Accessible names for icon buttons and form controls. Custom focus rings that bypass shared focus tokens.
- `className` must not override a design-system component's color, radius, or shadow. Layout classes can stay.
- `Modal.Body`, so long content scrolls and headers and footers can stay sticky.
- Theme-aware Material classes instead of raw shadows. Borders that duplicate a Material's built-in treatment.
- Spacing that falls off the 4px grid, with a standard utility when one exists.

Decision tree, from Vercel. The gate runner implements the "yes, a linter" branch. The other branches write a Decision or a warning and no Gate.

- Can code identify the failure without rendering?
  - No: agent guidance (Decision or Skill).
  - Yes: can the rule avoid likely false positives?
    - No: agent guidance.
    - Yes: does the violation have a concrete fix?
      - Yes: a Gate (`engine` chosen by the adapter).
      - No: a warning, or agent guidance.
- Needs product or codebase context: agent guidance.
- Establishes a new standard or product policy: a human decision.
- Either path gets an Exemplar or an EvalFixture that can catch a regression.
- If a rule stays reliable only with many exceptions, move it back to agent guidance. Drop the Gate. Keep the Decision.

Each Gate says why the pattern is a problem and suggests a concrete fix. Some may autofix a safe migration. The explanation of why, and any judgment call, stay in the Decision prose.

## Critique and Evaluate

**Critique.** The Critic is a review subagent in the user's harness, on a bigger model, with a crafted brief in the Pack. It reviews generator output (generate–review). The GAN metaphor is historical only. It runs in the adapter's Review mode. It cites the references it loaded. It does not edit unless asked. The exact message protocol, model choice, and number of passes are not locked. Changing them does not change Sweep.

The brief tells the Critic to check the change against the Rubric, the Exemplars (including known flaws), and the Gates. Findings are CriticFindings: location, verification, canonical source, user consequence, and the smallest concrete fix. Lead with user impact. Starting severity labels, from Vercel, until a dogfood review shows a better scale:

- **P0:** blocks the primary task, creates severe accessibility failure, or can cause unrecoverable user harm.
- **P1:** likely task failure, misleading consequence, missing critical state, or major responsive/accessibility defect.
- **P2:** meaningful friction, inconsistency, weak hierarchy, or recoverability issue.
- **P3:** minor craft or consistency improvement.

**Rendered check.** Vercel: "Source inspection establishes behavior; a rendered interface establishes visual and interaction quality. Never claim visual verification from code alone." The Pack instructs the harness to verify the rendered surface, including materially changed states. [OpenAI's Playwright / computer-use note](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4) is one way a harness can do that. Taste does not ship a browser. A CriticFinding with `verification: rendered` requires that check.

**Evaluate.** Product evals, adopted from Vercel's guidance evals. They measure whether the Pack improves harness UI work. Their `copywriting-eval` is a narrower copy check. It is not this loop.

1. EvalFixtures come from Exemplars documented in the Skill. Each fixture has a before state and an after state under `tooling/scripts/evals/`.
2. An agent edits the before state.
3. A judge checks the result against a Rubric and writes a JudgeResult.
4. Holdouts hide their expected edits, so the test is whether the guidance generalizes.
5. Run the same fixtures without the Skill (`run: without_skill`). That is the baseline for whether the Pack changed the agent's behavior.
6. Score `rule_correctness` separately from `similarity_to_shipped`.

Vercel, quoted:

> An agent edits a before state, then a judge checks the results against a rubric.
>
> Evals come from shipped examples documented in the skill. Holdouts hide their expected edits, testing whether the guidance generalizes. We also run fixtures without the skill to measure whether it changed the agent's behavior.
>
> We score rule correctness separately from similarity to the shipped result. Shipped code can contain a flaw that the agent should improve instead of reproduce.

Test retrieval and application separately. Failing to load the Skill and failing to follow a rule are different problems. The repo `AGENTS.md` trigger is its own test (`skill_loaded`).

**Data the eval may need.** A fixture sometimes cannot be built from the working tree alone. The coding agent, in the user's harness, may ask the user for access to production data and git history. That request stays in the harness, with the user approving it. The EvalFixture flags `requires_prod_data` and `requires_git_history` record the need. They do not grant access.

The PRD success signal is the Rubric: a mergeable first pass, no long design prompt, no re-teaching per screen. Gate pass rate and a with/without-pack comparison on past Ally UI changes are one optional path, not the only one. What proves a mergeable first pass without hand-labelling is still an open product question.

## First surface

Vercel, on where to start:

> The hardest part is picking the first surface. Every team has decisions worth encoding. The question is whether they live in someone's head or somewhere agents can find them.

Taste's job is to nudge the coding agent to write that surface as Decisions. Sweep, Learn, and the coding agent under the Skill follow the same discipline.

Start with one product surface where the same review comments already repeat. Collect shipped examples and real reviews as Evidence. Write the Decision, why it matters, the exceptions, and the source. Expand surface by surface. Keep CoverageGaps current.

Observable Decisions, not adjectives. Vercel:

> Avoid starting with broad adjectives like `clear`, `polished`, or `intuitive`. Agents need observable decisions. `Destructive actions use Verb + Noun` is usable. `Buttons should be clear` is not.

**Decision template.** This is the adapter serialization of a Decision. Fill it in before widening to the next surface. Status stays `proposed` until a human accepts it. Fields are Vercel's decision record.

```
# Decision: {name}

Status: proposed | accepted | rejected
Scope:
Decision:
Rationale:
Evidence:
Exceptions:
Bad example:
Good example:
Assumptions:
Open decisions:
```

| Template line | Decision field |
| --- | --- |
| Status | status |
| Scope | scope |
| Decision | statement |
| Rationale | rationale |
| Evidence | evidence_ids |
| Exceptions | exceptions |
| Bad example | bad_example |
| Good example | good_example |
| Assumptions | assumptions |
| Open decisions | open_decisions |

`mode` and `angle_id` are Taste fields the template does not have. The Pack loader sets them from the PackManifest and the reference file the record lives in.

The Skill's operating contract includes the nudge: when the same decision shows up and the Pack does not contain it, the agent writes this record into the narrowest file and leaves it pending. It does not silently invent a universal rule.

## Improve loop

The improve loop is how a Pack is built, used inside a harness, measured, and updated. Schemas stay stable. Harness roles stay the same unless the product change is the role itself.

**Define.** Write a short change note next to the run, in the harness notes or a doc. It is not a domain type and it is not a new schema.

| Field | Content |
| --- | --- |
| id | `improve/{slug}` |
| question | What this Pack update is meant to improve. |
| mode | `conformance` or `expression`. |
| changed | The only records this update may edit: Decision, Gate, Skill, or Rubric. One lever. |
| stable | `schemas`, and every harness role that is not the thing being changed. |
| fixture_ids | Including holdouts. |
| baseline | `without_skill`. |

```json
{
  "id": "improve/example-rule-correctness",
  "question": "Does this Decision raise rule_correctness on holdout fixtures?",
  "mode": "conformance",
  "changed": [{ "type": "Decision", "id": "decision/example" }],
  "stable": ["schemas", "Sweep", "Critique protocol", "Gate engine"],
  "fixture_ids": [],
  "baseline": "without_skill"
}
```

The example id is illustrative. It is not an Ally rule.

**Run.** Pack loader reads the adapter into a PackManifest. The harness runs the skill or check this update needs. A Conformance update runs Sweep or Learn, then Critique, then Evaluate. An Expression update waits until that path is open, then runs Interview. The harness owns the model loop. MCP tools are how it calls L3. The user approves any prod-data or git-history request the fixture flags.

**Eval.** Evaluate writes a JudgeResult per fixture, once `with_skill` and once `without_skill`. Read `rule_correctness` and `similarity_to_shipped` as separate numbers. Read `skill_loaded` before blaming a Decision for a miss.

**Update.** Edit only the `changed` records. Re-run Evaluate on the same fixtures.

| If you need to change… | Touch | Leave stable |
| --- | --- | --- |
| A judgment | Decision (and the adapter file that stores it) | Gate engine, Critic protocol, schemas |
| A mechanical check | Gate | Decision statement |
| How a job is done | Skill or Router row | L1 field names |
| What success means | Rubric dimension | EvalFixture before/after bytes, unless the fixture itself is the change |
| Review behavior | Critique protocol | Sweeper outputs |
| Where files live | Pack adapter id | PackManifest's other fields |
| A model workaround that no longer helps | MemoryLesson or Decision status `expired` | The principles on L0 |

That is the loop: name the lever, run it in the harness, read the JudgeResult, update the lever, evaluate again.

## Dogfood appendix

L4 bindings. They pass a repo path into Sweep. They do not appear on Pack schemas.

| When | Surface | Mode | What the harness runs |
| --- | --- | --- | --- |
| Now | HelloAlly ally-platform | Conformance | First pain: flow and interaction, as the first surface Sweep should look at. Critic and Evaluate run against that Pack. |
| Later | omnipresent | Expression | Interview. ExpressionPriors from the Expression path. |

Ally is the dogfood surface only. Product thinking stays harness-agnostic and product-agnostic. The lifecycle switch back to Conformance has no trigger yet.

Discovery is dual-track. Sweep followed by historical replay is one path. It is not locked as the only path.

## Open questions

Not locked, on purpose:

- The final abstract set of Angles.
- The MCP tool surface. The stub names in this doc are a starting list. They are not a locked tool surface.
- The Critique protocol beyond generate–review (model, passes, message shape). The GAN metaphor is historical only.
- The trigger that shows Expression is closed and the design is locked, so Taste switches to Conformance.
- Whether Sweep to historical replay is the only discovery path.
- Whether further engineering sources should still change this architecture before it is locked. This draft re-homes Vercel, OpenAI, and Emil on top of the LangChain and Anthropic baseline. The set is not closed. More research may refine it.
- How Sweep tells a deliberate pattern from an accidental or legacy one.
- What Evaluate proves a mergeable first pass without hand-labelling.
- Which Conformance lessons carry over when Expression starts on omnipresent.
- The MemoryLesson file layout and the slow-loop cadence. The fast and slow loops are in scope. The storage format is not.
- The 200-line `AGENTS.md` cap. Bound the index. LangChain's number is not the limit.

## Bibliography

What this architecture takes from each source. Quotes above are from these texts. Each source is a starting-base PoC, re-homed under the L1 types.

### LangChain — Content Studio

- Article: [Building a design agent](https://www.langchain.com/blog/design-agent)
- Open source: [langchain-ai/design-agent](https://github.com/langchain-ai/design-agent)
- Took: job-scoped Skills behind a Router; a Wiki that Skills link to; Gates in code for measurable checks; fast memory in the same turn and slow promotion into Skills and the Wiki; judgment in prompts and invariants in code; anti-default guidance; rules expire after model upgrades ([Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)); `AGENTS.md` as a bounded index. The harness owns the loop. Taste does not adopt Content Studio's media computer or Slack product.

### Anthropic — frontend skills

- Article: [Improving frontend design through Skills](https://claude.com/resources/articles/improving-frontend-design-through-skills)
- Took: distributional convergence as the reason unguided UI looks generic; Skills as on-demand context; prompt altitude between hardcoded values and vague praise; axes of typography, color and theme, motion, and backgrounds; custom Skills as the way an organization encodes its own design system. Generic aesthetics are ExpressionPriors. A custom Skill that encodes the shipped system is Conformance.

### Vercel — product-design

- Article: [Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel)
- Took: the default Pack adapter (skill plus linters plus a human review loop); adapter request modes; references, Exemplars, and CoverageGaps; Gates for deterministic rules and prose for judgment; Evaluate (before state, judge, Rubric, shipped Exemplars, holdouts, with/without-skill baseline, correctness scored separately from similarity); the first-surface quote and the Decision template; Learn as collector, judge, and human acceptance into the narrowest destination.

### OpenAI — delightful frontends

- Article: [Designing delightful frontends with GPT-5.4](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4)
- Pack pattern: [`frontend-skill`](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill)
- Took: underspecified prompts fall back to high-frequency patterns; hard rules for composition (hero budget, cardless default, brand-first, expressive type, atmosphere) as ExpressionPriors; the exception that an existing design system wins; visual references and early tokens; rendered verification with Playwright or computer use.

### Emil Kowalski — agents with taste

- Article: [Agents with Taste](https://emilkowal.ski/ui/agents-with-taste)
- Took: one Skill file per interface aspect; articulate why a Decision feels right; strict tables and flowcharts the agent can follow; package that experience so the agent stops guessing. Aspect Skills sit under the Router.

### Product

- [docs/prd.md](prd.md), mirroring [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) (Gopi · Draft · Oct 2026).
