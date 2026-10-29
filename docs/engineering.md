# Engineering

**Draft architecture for the product (v0) · Oct 29, 2026 IST**

## Status and scope

This is the architecture of Taste, the product we are building. Taste is a plugin for an existing coding-agent harness. The draft is not presumed final. More research may refine it. It is not a locked API.

The source articles (LangChain, Anthropic, Vercel, OpenAI, Emil) stay in full as the starting base. They are proof-of-concepts. This doc re-homes them under Taste's names. The [Vercel product-design tree](https://vercel.com/blog/teaching-agents-product-design-at-vercel) is the default on-disk **Pack adapter**, not the domain model.

**Product source of truth:** the [Google Doc one-pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit), mirrored in [docs/prd.md](prd.md). If this file and the Doc disagree about the product, the Doc wins.

**Audience:** Gopi and Dev for engineering. North for product alignment only.

**Hard goal:** from what a product has shipped, extract its taste across every design angle so any coding harness, given a PRD and the Taste Pack, first-passes UI you would merge. The abstract set of angles stays open and gets clearer as Packs are built. See the [PRD](prd.md).

Conformance and Expression are lifecycle states of a **part** of one Pack, from the [one-pager](prd.md). They are not two artefact sets. Gopi's locked rules:

1. A project that starts from scratch is in Expression.
2. Once a part is defined, agreed, and shipped, it moves to Conformance. Both modes use one Pack and the same artefacts.
3. When Conformance cannot justify what to do from the artefacts, that part goes back to Expression.
4. Otherwise Conformance keeps looping.
5. The whole Pack never flips. Parts of the Pack update.

Who initiates a mode change, a human or the harness, stays open in the one-pager. This file does not invent that. See [Mode lifecycle](#mode-lifecycle-infinity).

This repository stays docs-only. The schemas below are the product's domain model, written down so Pack files and harness tools have stable inputs and outputs. They are not implemented code. No application code, package manifest, MCP server, or skill files in this repo. The Pack adapter is a layout for a **target product repo**. MCP tool names and skill roles in this doc are contracts for the harness integration, not code to add here.

Read [System architecture](#system-architecture) for how Taste sits on a harness, then the [Abstraction stack](#abstraction-stack) for what a builder creates at each level. Domain schemas, the harness integration table, the Vercel Pack adapter, Conformance and Expression, gates, Critique, product evals, and the decision log follow. Dependencies run one way, so a skill, a tool, an adapter, or a dogfood binding can be replaced on its own.

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
│  PRD + one Pack → first-pass mergeable UI                 │
│  parts in Conformance or Expression                       │
└──────────────────────────────────────────────────────────┘
```

The middle box is the [L3 harness integration surface](#l3-harness-integration-surface) plus Pack files from the [L2 adapter](#l2-pack-on-disk-adapter). The bottom box is [L4](#l4-dogfood-bindings) when the target repo is a dogfood product. Ally and a greenfield surface such as omnipresent use the same plugin and the same tree. Parts of each Pack sit in Conformance or Expression. [L0](#l0-principles) and [L1](#l1-domain-schemas) are not boxes. L0 is the constraints. L1 is the schemas.

Taste does not replace the harness loop. It does not host its own runtime. It is context, tools, checks, pack-maintainer skills, and a Critic subagent brief.

Gates in that diagram default to the target repo's linter and CI, which is how Vercel runs them. MCP `run_gates` is an optional stub. The names in the MCP list are Taste glue, not names from the articles.

### How it works

One Pack. The ∞ is per part, carried by a Decision. Both lobes use the same tree, the same gates, the same Critic, the same evals, and one Learn sink. All of it runs inside the host harness.

```
                 one Pack (the Vercel tree)
                 state derived per Decision
     ┌──────── Expression lobe ─────────┐
     │ Shape / Interview                │
     │ proposed → accepted → shipped    │
     └───────────────┬──────────────────┘
                     │ lock-back:
                     │ accepted + shipped Evidence
                     ▼
     ┌──────── Conformance lobe ────────┐
     │ generate → gates → Critic        │
     │ Learn keeps that part current    │
     └───────────────┬──────────────────┘
                     │ material decision not
                     │ justified by rungs 3–4
                     │ (rung 5 may still propose)
                     └──────────► Expression
                                  for that part only

     Learn (both lobes) ▲
       • dev comments on first-pass PRs
       • CriticFindings / review packets
       • production signals (bugs, support,
         UX telemetry, design review of shipped UI)
```

The lobes differ in where the concrete alternatives come from, and in whether rung-6 priors are active for that part. They do not differ in Pack shape.

**A. Sweep proposes from shipped UI.** The user asks the harness to Sweep a product that already shipped. The Sweeper reads shipped UI and git history, with the user granting that access. For each angle it follows Anthropic's method. The concrete alternatives are what shipped. It writes `proposed` Decisions, CoverageGaps, and candidate Gates into the same tree. A part is not Conformance because Sweep wrote it. It becomes Conformance only when the Decision is accepted and has shipped Evidence. Vercel: "Treat shipped code as evidence, not automatic precedent." An empty Pack on a shipped product takes this path. It does not default the Pack to Conformance.

**B. Day-to-day UI generation (Conformance).** The harness starts a UI task. The repo `AGENTS.md` triggers the entry Skill. The steps are Vercel's workflow, in [Entry Skill](#entry-skill). Ally's first pain is flow and interaction, so the product-decision brief and the reachable-state map are not optional on that surface.

1. Resolve the Vercel request mode, then let the Router pick references and Skills. The mode is not a Router row.
2. For a material product or flow change, write the compact product-decision brief and map reachable states (loading, empty, sparse, populated, validation, error, permission, disabled, optimistic, stale, destructive, responsive).
3. Implement the smallest coherent change. OpenAI: ground it in real copy and product context from the PRD, not placeholders.
4. Before treating the patch as ready, validate it the way Vercel Agent does: the repository's builds, tests, and linters. That repo linter and CI are the default Gate path. MCP `run_gates` is optional.
5. Run Vercel's verify checklist, including compact and wide viewports and every changed state. When the harness provides it, OpenAI's Playwright skill walks those viewports and flows. Taste does not ship a browser.
6. Spawn the Critic subagent with LangChain's brief shape. It returns CriticFindings and, from Emil, a before/after table. The agent fixes, or a human merges.

**C. Learn (both lobes).** The same sink serves every part, whether that part is in Conformance or Expression. Two signal classes enter it.

Developer first-pass feedback: comments on the first-pass PR, rejected or accepted CriticFindings, and reteach notes. Vercel already gathers review comments, Slack, Figma, and previews into a review packet and keeps every candidate pending until a human accepts. LangChain's fast loop writes the correction in the same turn.

Production-system feedback: bugs, support themes, UX telemetry, and design review of shipped UI. A/B results count when the product already runs them. Gopi requires this class. The articles do not name the connectors. Record a signal as Evidence the existing kinds can point at (a review, a preview, a path, a commit). Do not add a telemetry product or a new Evidence kind here. Connectors stay open.

The Learner records a MemoryLesson in that same turn (fast), on the shared layer or the personal layer. After a job, LangChain's slow loop captures up to five evidence-backed lessons and associates them with the skill used. Future jobs read and rate those lessons. A weekly pass promotes the useful ones into a Skill or the Wiki. Vercel's intake still ends in a review packet, and a human accepts. A model upgrade does not expire a Decision.

Route the signal per part. If the part's accepted, shipped Decision still justifies the change, stay in the Conformance loop: Learn, review packet, update that Decision, Gate, or Exemplar. If a material decision cannot be justified from the artefacts, that part follows rule 3: CoverageGap, a `proposed` Decision, and Shape. Other parts of the Pack stay where they are.

**D. Interview proposes from intent.** The harness runs the Interviewer for a from-scratch project, or for a part that rule 3 sent back to Expression. ExpressionPriors seed the interview as rung-6 context. They are not Pack records. Interview writes `proposed` Decisions, Skills, and Wiki facts into the same Vercel tree. Steps are in [Expression path](#expression-path). A human accepts. Acceptance alone is not Conformance. The part locks when the Decision is accepted and shipped Evidence is attached.

**E. Day-to-day UI on an Expression part.** Same machinery as flow B, scoped to that part. Request mode, then Router. Product-decision brief and reachable states when the change is material. Repo linter and CI. Critic subagent. Product evals with and without the Pack. OpenAI's mood board is an input when the visual direction is still underspecified. Learn is flow C. Neighboring parts that are already Conformance stay on flow B.

## Abstraction stack

A builder implements Taste one level at a time. Each level states what it is, which artifacts live there, who owns them, what to edit, which harness primitive it uses, and which updates leave the neighboring levels intact.

L0 is principles only. L1 is domain schemas only. L2 maps those types to files. L3 is the harness integration surface. L4 is a dogfood binding and is not part of L1. L0–L4 is Taste's software structure, not a sourced technique.

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
L4 dogfood (Ally and a greenfield surface such as omnipresent, in parallel) is an edge binding. It is not in L1. Each product has one Pack. Parts of that Pack sit in Conformance or Expression.
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
- Both lobes are dogfooded in parallel, on one Pack. A from-scratch surface starts in Expression. A part that is defined, agreed, and shipped is Conformance. The five rules in [Status and scope](#status-and-scope) are locked. Who initiates a mode change stays open. See [Mode lifecycle](#mode-lifecycle-infinity).
- Judgment stays in prompts and in Decision prose. Invariants that must always hold live in code, as Gates. After a model upgrade, expire Skill prose that only compensated for the old model, and expire those MemoryLessons (LangChain's Bitter Lesson). Keep the design principles. A Decision is shipped judgment, not a model workaround, so a model upgrade does not expire it. A Decision leaves through human review.
- Evaluate scores rule correctness separately from similarity to shipped code.
- Generate–review means the coding agent generates and the Critic subagent reviews that output. Earlier notes called this GAN-inspired. That metaphor is historical only. The message protocol is still a placeholder.
- Taste is not an agent runtime, not a component library, and not a design-system product. OpenSignal does not own design judgment. Taste does not couple to OpenSignal.

[Content Studio](https://www.langchain.com/blog/design-agent) built harness_v1 as a design system of 115 reusable components. It stayed on brand, then repeated the same layouts and animations. That is why Taste is not a component library. The same article is why the harness owns the loop: taste is the designers' judgment written into skills and checks. Content Studio's sandbox, Slack UX, and media tooling are that product's harness. Taste does not rebuild them.

The [PRD](prd.md) ambition bar says agents carry a product's design judgment across harnesses and model upgrades, and that depth includes outside judges. Outside judges are why the Critic and the Evaluate judge stay off the generator's turn. The bigger-model Critic is the one-pager's. Anthropic's article does not specify a critic.

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
| Decision | id, angle_id, status (`proposed`, `accepted`, `rejected`, `superseded`), scope, statement, rationale, evidence_ids, exceptions, bad_example, good_example, assumptions, open_decisions. Vercel's template is the first three statuses. `superseded` is Taste glue for a human retiring a Decision. No `mode` field. Part state is [derived](#derived-part-state). |
| Angle | id, name, summary, decision_ids, skill_id, wiki_refs, coverage_gap_ids |
| Evidence | id, kind (`pr`, `commit`, `path`, `review`, `preview`), locator, note |
| Exemplar | id, title, decision_ids, known_flaws, evidence_ids. No `holdout` field. Holdouts live on EvalFixture. |
| CoverageGap | id, angle_id, missing, why_it_matters |
| Gate | id, decision_id, engine, check, why, fix, autofix |
| EvalFixture | id, before_ref, after_ref, exemplar_id, rubric_id, holdout, requires_prod_data, requires_git_history. No `mode` field. |
| Rubric | id, dimensions (id + question). Starting set: mergeable_first_pass, no_long_design_prompt, no_reteach_per_screen, rule_correctness, similarity_to_shipped, skill_loaded |
| JudgeResult | fixture_id, run (`with_skill` or `without_skill`), scores, skill_loaded, notes |
| MemoryLesson | id, loop (`fast` or `slow`), statement, evidence_ids, skill_id, scope (`shared` or `personal`), rating, target, status (`captured`, `promoted`, `expired`). `skill_id`, `scope`, and a later job's rating are LangChain. The status names and `target` are Taste glue. |
| CriticFinding | id, severity (`P0`–`P3`), location, verification (`source`, `rendered`, `unverified`), source_id, user_consequence, smallest_fix |
| PackManifest | Optional derived view, not a file the Pack requires. Taste glue. See [PackManifest](#packmanifest). |
| Skill | id, job, when_to_use, when_not_to_use, angle_ids, wiki_refs |
| Router | id, rows of `{ ask, skill_id }` |
| Wiki | id, facts, linked_from |
| ExpressionPrior | id, source (`anthropic`, `openai`, or `emil` only), statement. Rung-6 heuristics, outside the Pack. Active for a part in Expression. Subordinate per part where an accepted shipped Decision exists. Interview does not write these. |

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

Create the tree in the target product repo, or add another adapter id that stores the same L1 records under different paths. Edit paths and trigger prose here. Leave L1 field names as they are. Do not rename a field to match a filename. Do not put Ally-only directories inside `vercel-product-design`. Do not treat Shape, Implement, Review, Copy, or Harden as Conformance or Expression.

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
- MCP stubs: `load_pack`, `list_decisions`, `get_angle`, `load_skill`, `run_gates`, `record_correction`, `list_coverage_gaps`. These names are Taste glue: agent-authored starting names, not from the articles or the one-pager. The one-pager only says an MCP server.
- Gate runners as the target repo's linter and CI. That is the default, from Vercel. MCP `run_gates` is an optional extra.
- Pack loader as the `load_pack` tool or as a skill preamble that resolves a PackManifest from L2 paths.
- Evaluate as a judge step the harness runs, offline or in CI: fixtures in, JudgeResult out. Vercel is the source of that judge. The [PRD](prd.md) calls for outside judges, so this judge stays off the generator's turn. LangChain does not define this eval.

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

| When | Repo and surface | Where its parts start | What the harness runs |
| --- | --- | --- | --- |
| Now | HelloAlly ally-platform. First pain: flow and interaction, the first surface Sweep should look at. | Mostly Conformance after Sweep Decisions are accepted and have shipped Evidence. Unjustified parts stay in Expression (rule 3). | Sweeper proposes. Day-to-day skills, Gates, Critic, and Evaluate on the parts that have locked. Interview on parts in Expression. |
| Now, in parallel | omnipresent, or another greenfield surface | Starts in Expression (rule 1). Parts lock to Conformance as they ship. | Interviewer proposes into the same Vercel tree. Same gates, Critic, and product evals. |

#### Who owns it

The dogfood product owns the repo, the shipped UI, and the human who accepts or rejects Decisions. Taste does not own Ally. The harness is whichever coding harness that team already runs.

#### How a builder works at this level

Pass each dogfood repo path in and name its first surface. Wire that repo's `AGENTS.md`, linter, and CI to the L3 roles. Leave L1, L2, and L3 contracts untouched. Do not add Ally fields, or omnipresent fields, to Decision, PackManifest, or MCP tool inputs. Do not copy either product's component names into the default adapter. Run product evals on each dogfood Pack. That is a parallel measurement, not a separate system.

#### How it hooks the harness

The same hooks as L3, aimed at each dogfood repo. `AGENTS.md`, the skill loader, the MCP client, the Critic subagent, and that repo's lint CI. Taste does not install a second runtime beside either harness.

#### Stability

Changing the dogfood repo or the first surface is a dogfood binding change. It does not change L1 schemas, the default adapter, or the skill and MCP contracts. Another product can take the Ally seat without a schema migration.

## Domain model

Names used from here on. Vercel filenames appear again only in the [Pack adapter](#pack-on-disk-adapter).

| Name | Meaning |
| --- | --- |
| Conformance | Lifecycle state of a part, derived. Not a record type. The Decision is `accepted` and has shipped Evidence. |
| Expression | Lifecycle state of a part, derived. Not a record type. Open CoverageGap or open decisions, status `proposed`, or `accepted` with no shipped Evidence yet. |
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
| PackManifest | Optional derived index: ids and which adapter stores the Pack. No global mode. |
| ExpressionPrior | Rung-6 heuristics (Anthropic, OpenAI, Emil). Outside the Pack. Active for a part in Expression. Subordinate, per part, where an accepted shipped Decision exists. |

Schemas are the product's domain model. They are not a shipped API. Conformance and Expression are not fields. See [Derived part state](#derived-part-state). The two names are the PRD's.

**What a source actually names.** Decision matches Vercel's decision template. CriticFinding matches Vercel's review output. Router matches LangChain's ask-to-skill table. EvalFixture, Rubric, and JudgeResult match Vercel evals plus the PRD success signals. MemoryLesson's fast loop, slow loop, shared-versus-personal scope, skill association, and later rating match LangChain. Holdouts match Vercel eval fixtures only.

**Taste glue.** Agent-authored starting names, not from the articles or the one-pager: PackManifest, the optional derived roll-up, the MCP tool names, Evidence `note`, Angle `summary`, `skill_id`, `wiki_refs`, and `coverage_gap_ids`, Wiki `facts` and `linked_from`, MemoryLesson `status` names and `target`, Decision `angle_id`, and `superseded`. Useful for a builder. Not a proven technique. `mode` is not glue. It is not a field.

### Derived part state

Mode is computed per Decision from Vercel fields. It is not authored on the Pack, on a Decision, on an Angle, on an EvalFixture, or on PackManifest. Roll a surface or an Angle up by reading its Decisions. Mixed surfaces are normal. The Pack never flips.

A part is in **Expression** when any of these hold:

- an open CoverageGap, or `open_decisions`, on that part
- the Decision status is `proposed`
- the Decision is `accepted` and has no shipped Evidence yet (`pr`, `commit`, or `path`). The decision log reports that as "agreed, awaiting ship." Do not add a status for it.

A part is in **Conformance** when the Decision is `accepted` and it has shipped Evidence (`pr`, `commit`, or `path`).

`rejected` and `superseded` are retired records. They are not a mode.

The predicate uses only Vercel fields: Decision status, Evidence, CoverageGap, open decisions, and the [authority ladder](#entry-skill). ExpressionPriors are rung 6. They sit outside the Pack. They are active for a part in Expression, and subordinate for a part that already has an accepted shipped Decision.

**Engineering readings, not product locks.** Rung 5 (verified adjacent shipped patterns) stays on the Conformance side as a propose-through-Learn path: justify the change and write a `proposed` Decision. A human still accepts. A `proposed` Decision's candidate Gate is a warning at most. Gates enforce only accepted Decisions.

### Decision

| Field | Content |
| --- | --- |
| id | Stable id. Adapter example: `decision/destructive-names-action`. |
| angle_id | Angle it belongs to. |
| status | `proposed`, `accepted`, `rejected`, or `superseded`. Stays `proposed` until a human accepts it. Vercel's template is `proposed`, `accepted`, or `rejected`. `superseded` is Taste glue for Vercel's "removing those that stop helping." `expired` is not a Decision status. Whether the part is in Expression or Conformance is [derived](#derived-part-state) from this status plus shipped Evidence. |
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
| summary | What this angle means in this product. An Angle is not a mode. It holds Decisions in either lifecycle state. |
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

Holdouts are not an Exemplar field. Vercel builds "holdouts from interfaces whose expected edits do not appear in the skill," and those holdouts are EvalFixtures.

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
| before_ref | Before state. The fixture does not store a mode. A holdout whose expected edit comes from intent belongs with a part in Expression. A fixture taken from a shipped Exemplar belongs with a part in Conformance. The link is the Decision and its Evidence. |
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
| skill_id | The Skill this lesson is associated with. LangChain's slow loop. |
| scope | `shared` or `personal`. LangChain stores memory in two layers. Shared standards take precedence over a personal preference. |
| rating | Set when a future job reads the lesson. LangChain does not define a scale. Do not invent one here. |
| target | Skill, Wiki, or Decision id to promote into. Empty while pending. Taste glue. |
| status | `captured`, `promoted`, or `expired`. Taste glue around LangChain's loops. `expired` is for a lesson that compensated for a model weakness. It is not a Decision status. |

Fast: write it in the same turn the person states it. LangChain stores that on a shared layer or a personal layer. Each layer has its own `AGENTS.md`. Slow: after each job, a lightweight pass captures up to five evidence-backed lessons and associates them with the skill used. Future jobs read and rate those lessons. Content Studio promotes the useful ones on a weekly pass. The weekly cadence is their practice, not a Taste lock. A company-channel or product rule follows the product voice.

When a designer makes a subjective call, LangChain captures the reasoning in a skill so the next draft can apply it. That reasoning is the lesson statement, not a new record type.

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

Taste glue. An optional derived view of what Vercel already indexes in the repo `AGENTS.md` and the skill-local `AGENTS.md`, and of what LangChain keeps as a bounded index. It is not a file the Pack requires, and no article defines it. No Ally-specific fields. No harness-specific fields. The harness integration may read this view when a tool resolves the Pack. The files remain the source.

| Field | Content |
| --- | --- |
| product | Display name of the target product. Free text. |
| adapter | Default: `vercel-product-design`. |
| angle_ids | |
| decision_ids | |
| exemplar_ids | |
| coverage_gap_ids | |
| gate_ids | |
| skill_ids | Includes the Router. |
| wiki_refs | |
| eval_fixture_ids | |
| derived_roll_up | Optional glue. Computed, never authored. Per surface: how many Decisions are Conformance, how many are Expression, how many CoverageGaps are open. ExpressionPriors are not indexed here. They are rung 6, outside the Pack. |

```json
{
  "product": "",
  "adapter": "vercel-product-design",
  "angle_ids": [],
  "decision_ids": [],
  "exemplar_ids": [],
  "coverage_gap_ids": [],
  "gate_ids": [],
  "skill_ids": [],
  "wiki_refs": [],
  "eval_fixture_ids": [],
  "derived_roll_up": {
    "note": "optional glue; computed, not authored",
    "by_surface": []
  }
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
| Gates | Deterministic checks. Default: the repo linter and CI (Vercel). MCP `run_gates` is optional. | Harness shell or CI. MCP only if that optional stub is registered. |
| MCP server | Tools registered on the harness MCP client. The one-pager names the server. The tool names in this doc are Taste glue. LangChain: write tool descriptions with the same care as skill descriptions, and put MCP tools behind search so schemas load on demand. | Harness tool calls |
| Sweeper | A skill, or a dedicated agent turn, the harness runs to extract a Pack from shipped UI | Coding agent |
| Learner | A skill or hook that records corrections into the Pack (fast) and promotes them later (slow) | Same harness session, or a scheduled agent turn |
| Interviewer | A skill the harness runs for any part in Expression (rule 1 or rule 3), on any product, including Ally | Harness, when that part is in Expression |
| Critic | A harness subagent on a bigger model, with the Critic skill and brief from the Pack. Generate–review. | Harness subagent API |
| Eval fixtures / Rubric / Judge | Product evals. An offline run or a CI job measures whether the Pack changed harness UI work. | Harness or CI |
| Pack loader | Resolves a PackManifest from on-disk adapter paths | MCP `load_pack`, or a skill preamble |

### What each role reads and writes

| Role | Harness primitive | Reads | Writes |
| --- | --- | --- | --- |
| Pack loader | MCP `load_pack`, or a skill preamble. The role that resolves L2 paths. | Adapter files | PackManifest and the records it indexes |
| Sweep | Sweeper skill, or a dedicated agent turn | Target repo, and Evidence the harness can reach after the user approves access | Proposed Decisions, Evidence, Exemplars, CoverageGaps, candidate Gates |
| Learn | Learner skill or hook, in the same session or on a schedule | Corrections, intake packets | MemoryLesson (`fast` immediately). Later: a promoted Skill, Wiki, or Decision |
| Interview | Interviewer skill. Runs for any part in Expression (from scratch, or rule 3), on any product. | Intent for that part. Rung-6 priors are context, not records. | `proposed` Decisions in the same tree. Not ExpressionPriors. |
| Critique | Critic brief. Harness subagent on a bigger model (one-pager). Brief shape from LangChain. | Generator output, Pack, Rubric | CriticFindings, plus Emil's before/after table. Edits only when the request mode asks for edits |
| Evaluate | A judge step the harness runs, offline or in CI. Source: Vercel, not LangChain. | EvalFixture, Rubric, with-skill and without-skill runs | JudgeResult |
| Gate runner | Repo linter and CI. The role that knows an engine. Optional MCP `run_gates`. | Gate records, the diff | Pass, fail, or warning per Gate. Decision records stay untouched |

Interview proposes for any part in Expression, including a pocket on Ally. It writes the same Vercel tree. Learn runs for every part.

Business rules, as the behavior of these roles:

- Shipped wins over a conflicting stated preference. Sweep records the shipped pattern as Evidence. A preference that contradicts it does not become an accepted Decision.
- A universal rule needs human acceptance. Sweep and Interview both write `status: proposed`, then stop. Learn does the same when it proposes a Decision.
- A material decision with no rung 3–4 justification becomes a CoverageGap, a `proposed` Decision, and a Shape or Interview pass for that part. A human accepts. Vercel: new standards stay with people. A candidate stays pending until a human approver accepts.
- Gates enforce accepted Decisions. A `proposed` Decision's candidate Gate is a warning at most. That sentence is an engineering reading, not a product lock.
- One screenshot, one shipped file, or one reviewer comment does not become a Decision by itself.
- Measurable invariants become Gates. Judgment stays on the Decision and in the Skill prose.
- After a model upgrade, delete Skill prose that only compensated for the old model, and mark those MemoryLessons `expired`. Keep the principles. Do not mark a Decision `expired`. A Decision leaves when a human sets `rejected` or `superseded`.
- Critique's protocol can change without a Sweeper change. The Gate engine can change without a Decision change.

### MCP tool stubs

Documented names for L3. This repo does not implement them. The names are Taste glue: agent-authored starting names, not from the articles or the one-pager. The one-pager says an MCP server and stops there. The list is not a locked tool surface.

LangChain, on tools: "Descriptions matter for tools just as much as for skills." They put MCP tools behind a built-in search. The agent starts with its own tools and loads further tool schemas when a keyword search over names and descriptions asks for them. Taste MCP stubs follow that rule. A stub ships with a description that says when to call it and when not to.

`run_gates` is optional. The default Gate path is the target repo's linter and CI.

| Tool | When to call | When not to | In | Out | Role |
| --- | --- | --- | --- | --- | --- |
| `load_pack` | A UI task needs the Pack index | The skill files are already loaded | adapter id, repo root | PackManifest | Pack loader |
| `list_decisions` | The task needs Decisions for an angle, a status, or shipped Evidence | A single known Decision is already in context | angle_id?, status?, shipped? | Decision[] | Pack loader |
| `get_angle` | The task is scoped to one angle | The angle's references are already loaded | angle_id | Angle plus its Decision ids | Pack loader |
| `load_skill` | The Router has picked a specialist Skill | The entry Skill is enough | skill_id, or a Router ask | Skill body | Pack loader |
| `run_gates` | Optional. The repo linter is not already in the loop | The default path, which is the repo linter and CI | paths or diff | Gate results | Gate runner |
| `record_correction` | Someone states a rule or a correction this turn (LangChain fast loop) | Promoting a lesson into a Skill or the Wiki. That is the slow loop | MemoryLesson fields (`loop: fast`) | MemoryLesson id, status `captured` | Learn |
| `list_coverage_gaps` | Sweep or Learn is looking for missing standards | The task is ordinary UI implementation | angle_id? | CoverageGap[] | Pack loader |

The harness calls these. Taste does not own the loop around them. `shipped?` on `list_decisions` is a derived filter: the Decision is `accepted` and has Evidence of kind `pr`, `commit`, or `path`. It is not a stored mode. The parameter name is still Taste glue.

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

### Entry Skill

`SKILL.md` is the entry Skill. Vercel: "`SKILL.md` owns the runtime workflow." The contract, the request modes, and the workflow below are that file's contents for a target product. Names such as Geist stay Vercel's. A target repo routes to its own canonical docs.

**Operating contract.** From Vercel's `SKILL.md`. The entry Skill carries these, not a shorter paraphrase:

- **Start with the job, not the pixels.** Who is acting, what they are trying to accomplish, the product object, and what the system will change.
- **Define the outcome before the output.** The current user problem, desired behavior, success signal, and non-goals, before a surface or component.
- **Use evidence, not taste.** Trace a decision to product behavior, canonical repository guidance, an accepted design decision, or a verified adjacent pattern.
- **Separate facts from decisions.** Mark assumptions and unresolved product choices. Do not hide them in implementation details.
- **Treat shipped code as evidence, not automatic precedent.** It proves what exists, not why it is correct. Check it against current components, product behavior, and explicit guidance.
- **Choose the smallest coherent intervention.** Consider better defaults, behavior, or reuse before adding UI. Do not solve one job by creating unrelated settings or abstractions.
- **Decide before decorating.** Resolve information architecture, component semantics, interaction, and state behavior before styling or rewriting copy.
- **Design every reachable state.** Include only states the product can actually enter, and do not stop at the populated success case.
- **Verify the real surface.** "Source inspection establishes behavior; a rendered interface establishes visual and interaction quality. Never claim visual verification from code alone."
- **Keep one user-facing entry point.** Invoke this skill and route internally to the canonical sources.

**Request mode, then Router.** Vercel resolves the mode from the user's verb and artifact before acting, so an audit does not become an edit and a copy pass does not become a redesign. LangChain's Router is a separate table: a kind of job to a specialist Skill. Taste keeps that order. Resolve the Vercel mode first. Then the Router picks references and Skills. A mode is not a Router row.

A material decision, in Vercel's words, "changes the user's task, default, scope, consequence, navigation, interaction surface, or reachable states." Copy mechanics, token replacement, and established component substitutions usually are not material.

**Workflow.** Vercel's seven steps. Ally's first pain is flow and interaction, so steps 3 and 4 are the method for that surface.

1. **Set scope and mode.** Name the target surface and the request mode.
2. **Load product context.** Before proposing UI, read the applicable `AGENTS.md` chain, the supplied briefs, and the product logic for mutations, permissions, validation, errors, and side effects.
3. **Model the product decision.** For Shape, Implement, Harden, a full Review, or any material product or flow change, write a compact internal brief: user, job, current behavior, desired outcome, success signal, non-goals, object, scope, action, consequence, reversibility, permissions, and open decisions.
4. **Map the surface and states.** Inventory entry points, visible regions, overlays, transitions, exits, and return paths. Map only reachable states: loading, empty, sparse, populated, validation, error, permission, disabled, optimistic, stale, destructive, and responsive variants.
5. **Load the routed references.** Material product, flow, or component decisions load product-judgment. Implementation, a material visual change, or a full review loads interface-quality. Copy loads its reference. Overflow, localization, extreme data, and network or error resilience load the resilience reference.
6. **Decide, then implement.** For each non-mechanical change, answer: what user problem this solves, why this component is appropriate, what consequence the interface must communicate, which evidence supports it, and what the smallest coherent change is. **Justification check.** For each material decision, cite authority rung 3 or 4, or rung 5 as a `proposed` Decision. Rung 5 is an engineering reading: an adjacent shipped pattern stays on the Conformance propose path and goes through Learn. It is not a product lock. If none of those rungs justify the decision, that part enters Expression. Write a CoverageGap and a `proposed` Decision in the narrowest file, run Shape or Interview with rung-6 priors, and surface it to a human. Vercel: a new standard stays with people. A candidate stays pending until a human approver accepts.
7. **Verify.**
   1. Confirm the primary job and the acceptance criteria.
   2. Run repository lint checks.
   3. Inspect compact and wide viewports.
   4. Exercise every materially changed reachable state.
   5. Verify keyboard order, focus movement, loading behavior, and pointer or touch targets.
   6. Test long content, large values, constrained width, and localization or RTL risk.
   7. Vercel loads `review-design-system` for structural visible changes. A target repo loads its own design-system review reference when it has one.

LangChain's spec-driven path is a precedent for flow work: agree a storyboard, check pacing with an animatic, and only then go to production. They moved that order into code after the agent skipped a review to save time. It lines up with Vercel's Shape mode. It does not add storyboard stages to a product UI Pack.

**Sandbox check before the suggestion.** Vercel: "When Vercel Agent proposes a patch, it validates the change in a secure Vercel Sandbox with the repository's builds, tests, and linters before posting the suggestion." Flow B does the same with the harness the product already has. Run that repo's builds, tests, and linters before treating the patch as ready. Taste does not ship Vercel's sandbox.

**Rule reference template.** This is the `references/*.md` shape. Vercel, separate from the Decision template:

```
# {Surface}

Load when:
Canonical owner:

## rule/{stable-id}

Scope:
Rule:
Why:
Exceptions:
Source:

## Examples

Bad:
Good:

## Coverage gaps

- {missing decision or evidence}
```

The Decision template in [First surface](#first-surface) is the decision record. This template is the reference file that holds one or more of those rules.

**Adapter request modes.** These are Vercel's workflow verbs inside `SKILL.md`. They are not Conformance and Expression. Those two are [derived per part](#derived-part-state). They are not fields on the Pack or on a Decision. The adapter verb only decides whether this turn may edit.

`SKILL.md` resolves the adapter mode before acting, so an audit does not become an edit and a copy pass does not become a redesign.

| Adapter mode | Required behavior |
| --- | --- |
| Shape | Frame the problem, alternatives, flow, states, acceptance criteria, and open decisions. Edit only when asked. |
| Implement | Resolve material product decisions, then make the smallest coherent change in scope. |
| Review | Inspect source and rendered evidence. Report findings. Edit only when asked. Critique runs here. |
| Copy | Edit user-facing language and the JSX that language requires. Report structural blockers without widening scope. |
| Harden | Keep the settled direction. Fix state, resilience, responsive behavior, accessibility, and finish. |

When the verb is ambiguous, use the narrowest mode. A URL, screenshot, route, or component sets scope. It does not by itself authorize edits.

**Routing.** After the request mode is resolved, the Router loads focused references for the task and the surface. Material changes load product-judgment and interface-quality. Copy, layout, interaction, and resilience each route to their own reference. A modal loads destructive-action patterns. A settings form loads labels, validation, and disclosure. Component APIs, design-system docs, and accessibility criteria stay with their owners. The Skill links to them.

**Decision authority.** Adopt Vercel's order. Rung 3 is the target repo's own canonical docs.

1. The user's explicit goal and constraints for this task.
2. Verified user and product evidence, including what shipped.
3. Repository-canonical guidance: `AGENTS.md`, component APIs, the product's design-system docs, routed Skills.
4. Accepted Decisions and Exemplars with stable Evidence.
5. Verified adjacent shipped patterns in the same product area.
6. General interface heuristics. This rung is ExpressionPriors (Anthropic, OpenAI, Emil). They sit outside the Pack. They are active for a part in Expression.

The PRD rule sits on rungs 2 and 5: when a stated preference conflicts with what shipped, shipped wins. The user's goal for the current task still comes first. Shipped code is Evidence of what exists. It becomes an accepted Decision only through the record in [First surface](#first-surface).

Rung 5, an engineering reading and not a product lock: a verified adjacent shipped pattern can justify the change and become a `proposed` Decision through Learn. The part stays on the Conformance propose path. It does not enter Expression only because the match is adjacent rather than canonical. A human still accepts.

**Governance.** From Vercel's skill integrity. These are Learn, Sweep, and Interview rules.

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

That rule is their example of an observable Decision (`statement` plus `bad_example`). A target product's Decisions come from Sweep or from Interview. Both write `proposed` and stop for a human. The alternatives differ: shipped Evidence, or elicited intent.

## Knowledge layers

[Content Studio](https://www.langchain.com/blog/design-agent) organizes an agent's knowledge into four functions. That is the v0 baseline, and it is how Pack records are grouped. [Anthropic's frontend-skills article](https://claude.com/resources/articles/improving-frontend-design-through-skills) is the other half of the baseline: Skills are dynamic context, loaded for the task, rather than a permanent system prompt.

| Layer | L1 types | Role |
| --- | --- | --- |
| Skills | Skill, Router | How to do a job. Job-scoped, behind a Router. A description reads like a routing rule, including when not to use it. |
| Wiki | Wiki | Shared craft and product facts: brand tokens, voice, patterns, product behavior. Skills link to the Wiki. They do not copy it. |
| Gates | Gate | Deterministic checks for anything measurable. |
| Memory | MemoryLesson | Fast: a correction is saved in the same turn. Slow: lessons that hold are promoted into a Skill, the Wiki, or a Decision. |

**Router.** The Router is mostly one table. Each row maps a kind of ask to the specialist Skill that handles it. Content Studio uses this so craft is written once and jobs compose. Taste uses the same shape for jobs. Vercel request modes are not rows in that table. `SKILL.md` resolves the mode first, and the Router runs after that, so a Review does not turn into an edit.

Anthropic's frontend prompt was about 400 tokens, compact enough to load as a skill without bloating context. Their web-artifacts-builder skill also carries scripts for repo setup and bundling, so boilerplate does not sit in the prompt. A Taste Skill stays task-scoped the same way. The 400-token figure is their prompt, not a Taste cap.

**Wiki.** Shared facts live in one place. LangChain: "Rather than duplicating this information across skills, we link directly to the wiki." A font rule changes once. Every Skill follows the link. In the default adapter those facts sit in `references/` until a later adapter adds a `wiki/` path. The Wiki type does not change.

LangChain's guidance stack, which belongs in the Wiki and the Skills that link to it: start with brand tokens, font weights, spacing, and alignment; add design principles (their example is one focal point per frame); add guardrails against common AI design patterns; and keep the reasoning behind each piece of feedback. That reasoning is what Learn writes into a Skill.

**Product UI Wiki, from OpenAI.** Product UI still needs named tokens and type roles. OpenAI: define `background`, `surface`, `primary text`, `muted text`, and `accent`, and type roles `display`, `headline`, `body`, and `caption`, early in the build. For a part in Conformance those names are whatever the product shipped. They are Wiki facts a Gate may check. They are not a license to invent a new palette.

The same article's product-UI rules belong in the Wiki for an app surface such as Ally. They apply to parts in Conformance:

- **Apps.** Default to Linear-style restraint: calm surface hierarchy, strong typography and spacing, few colors, dense but readable information, minimal chrome, cards only when the card is the interaction. Avoid dashboard-card mosaics, thick borders on every region, decorative gradients behind routine product UI, and competing accent colors.
- **Utility copy.** For a dashboard, app surface, admin tool, or operational workspace, prefer utility copy over marketing copy. Prioritize orientation, status, and action. Section headings say what the area is or what the user can do. If a sentence could appear in a homepage hero, rewrite it until it sounds like product UI.

Hero budget, cardless landing pages, and atmosphere stay ExpressionPriors. They are active for a part in Expression, including a page that has no accepted shipped Decision yet. See [Expression path](#expression-path).

**Judgment in prompts, invariants in code.** Content Studio: "The order that must always hold lives in code, and the judgment stays in the prompt." They had described a required review order in instructions, and the agent skipped it. The order moved into code. Creative calls stayed in the prompt. Taste uses the same split. A Gate can count options, reject a nested modal, or flag a token that is off the product scale. Choosing the right object and consequence for a destructive action stays on the Decision, with its Evidence.

**Memory.** Fast loop: when someone states a rule or a correction, Learn writes a MemoryLesson in the same turn (`record_correction`), on the shared layer or the personal layer. Slow loop: after each job, capture up to five evidence-backed lessons, associated with the skill used. Future jobs read and rate those lessons. Content Studio incorporates the useful ones into the skills and the wiki on a weekly pass. The cadence is not locked. Shared standards take precedence over a personal preference. A company-channel or product rule follows the product voice.

**Rules expire.** Content Studio's [Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html): "Rules designed to compensate for a model's weaknesses become less useful as models improve." A key takeaway: "Rules that make up for a model's weaknesses expire, so keep the design principles and remove the workarounds as models get better." After a model upgrade, delete those workaround rules from Skill prose and set the matching MemoryLesson to `expired`. Keep the design principles. Do not set a Decision to `expired`. A Decision that stops helping is removed by human review, Vercel's "removing those that stop helping," as `rejected` or `superseded`. Then re-run Evaluate.

LangChain's 200-line bound is on the memory-layer `AGENTS.md` (shared and personal) that loads on every model call. An early version grew to 500K tokens. The one-pager separately asks for `AGENTS.md` as a bounded index, with growth going into skills and the wiki. That one-pager line is the repo `AGENTS.md` and the skill index. LangChain's 200 is not a cap on the repo trigger file, and it is not a Taste cap.

**Altitude.** Anthropic, on prompting at the right altitude: avoid "low-altitude hardcoded logic like specifying exact hex codes and vague high-altitude guidance that assumes shared context." A Skill states why a Decision is right and the observable rule an agent can follow. Vague praise is not a Decision. A hex value the product did not ship is not a Decision. A token the product actually shipped is a Wiki fact, and a Gate may check it.

## Conformance path

Conformance is the lifecycle state of a part whose Decision is `accepted` and has shipped Evidence. Sweep proposes Decisions from a shipped product. Writing them does not put the part in Conformance. Interview runs for any part of this same Pack that is in Expression, including on Ally. Learn is the shared sink in [System architecture](#system-architecture), flow C. Day-to-day UI on a Conformance part is flow B. Proposing from shipped UI is flow A.

Sweep steps. The first-surface rule and the Decision template are in [First surface](#first-surface). The product names which surface is first. Ally's choice is in the [dogfood appendix](#dogfood-appendix), not in this procedure.

Anthropic's four-step method is how Sweep fills an angle: "identify convergent defaults, provide concrete alternatives, structure guidance at the right altitude, and make it reusable through Skills." When Sweeping, the concrete alternatives are the product's shipped ones. A ban list that merely swaps one generic default for another is the failure Anthropic names, their Space Grotesk example.

1. Pack loader reads the adapter. The adapter id is `vercel-product-design`. If the Pack is empty and the product has already shipped, Sweep proposes. The Pack does not default to Conformance. If the project is from scratch, Interview proposes. See [Expression path](#expression-path).
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

**Learn loop.** Vercel's update loop is Learn, and it is shared with Expression. Cadence is not locked. Developer comments on a first-pass PR, CriticFindings, and the review packet are the first signal class. Production signals (bugs, support, UX telemetry, design review of shipped UI) are the second. Gopi requires that second class. Connectors are not specified, so they enter as Evidence, not as a new pipeline. Vercel's judge prompts:

> You are the collector. Gather messages, links, files, and nearby context. Write raw artifacts only. Do not score candidates or propose rules.
>
> You are the judge. Validate coverage before grouping related evidence. Separate verified facts, inferences, and open questions. Keep every candidate pending. Do not edit the guidance.

1. A collector gathers messages, links, and nearby context. It does not propose rules. Output is Evidence plus raw notes.
2. A separate judge validates coverage before grouping, verifies sources, and records open questions. Candidates stay pending. This judge is the intake judge, not Evaluate's JudgeResult. LangChain does not define this judge.
3. The job creates a review packet: candidates, rejected topics, follow-up requests, and coverage gaps. Every candidate links to its source. A comment from an experienced reviewer can raise its priority, but every candidate still needs evidence.
4. A human accepts a candidate into the narrowest destination. Vercel also allows accepted decisions as human-readable guidance next to the relevant component, not only inside the skill. The human review requires stable evidence, explicit scope and exceptions, and an approver. Emil: "Of course the more creative part of the job is still up to you." Automation ends at the review packet.

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

Expression is a lifecycle state of a part, on the same Pack as Conformance. The harness skill is Interview. This is flow D, then flow E. It runs for a from-scratch project (rule 1) and for any part that rule 3 sent back, including on Ally. The [PRD](prd.md) states the same loop.

Interview writes Decisions with status `proposed`, plus the Skills and Wiki facts those Decisions need. It does not write ExpressionPriors. Those priors are rung-6 article guidance, outside the Pack. `source` stays `anthropic`, `openai`, or `emil`. There is no `interview` source. Priors seed the interview. The Pack they inform is the one Vercel tree.

**Required output shape.** The same adapter, `vercel-product-design`. Not a second tree.

```
AGENTS.md
.agents/skills/product-design/
  SKILL.md
  AGENTS.md
  references/*.md
  exemplars/pr-*.md
tooling/scripts/evals/
  fixtures.json
  rules-checklist.json
  <fixture>/before/
  <fixture>/after/
```

`references/*.md` uses Vercel's rule reference template (`rule/{id}`, scope, rule, why, exceptions, source, bad/good examples, coverage gaps). `SKILL.md` carries the operating contract, the request modes, and the seven-step workflow. Decisions use the Decision template. Holdouts sit on EvalFixtures.

**Interview steps.** A builder implements these the same way Sweep proposes: write `proposed` Decisions, then stop.

1. Create the tree above if the Pack is empty. Adapter id: `vercel-product-design`. Do not set a Pack mode. An empty Pack on a from-scratch project takes this path. An empty Pack on a shipped product takes [Conformance path](#conformance-path) step 1 instead, and Sweep proposes.
2. Load ExpressionPriors as rung-6 context for parts in Expression. They are not Pack records. Anthropic: identify convergent defaults, then the product's own alternatives, at the right altitude, packaged as Skills. OpenAI: underspecified prompts fall back to high-frequency patterns. Emil: one skill file per aspect, with why and a strict table or flowchart. Do not copy a prior in as an accepted Decision.
3. Elicit the product judgment the tree needs: who acts, the job, the object, the consequence, reversibility, permissions, and every reachable state (Vercel's brief and state map). Where the surface is product UI, elicit OpenAI's Apps restraint, utility copy, and the token and type roles, filled with this product's choices rather than a generic palette. A mood board or other visual reference is an input when the direction is underspecified.
4. Write one proposed Decision per observable judgment, in the narrowest `references/` file, with a stable `rule/{id}`. Status stays `proposed`. Map aspect guidance to specialist Skills under the Router. Resolve request modes in `SKILL.md` before the Router runs. Measurable slices become candidate Gates.
5. Write Exemplars for decisions worth repeating and for known flaws. Write CoverageGaps for anything Interview could not lock. Write EvalFixtures, including holdouts whose expected edits stay out of the Skill text.
6. Stop. A human accepts, rejects, or leaves each candidate pending. Emil: "Of course the more creative part of the job is still up to you." Acceptance alone is not Conformance.
7. Day-to-day UI is flow E, the same gates, Critic, verify checklist, and product evals as flow B. Learn is flow C. Neighboring parts that are already Conformance stay on flow B.
8. **Lock back.** When a human has accepted the Decision and the change has shipped, attach the PR, commit, or path as Evidence. Write an Exemplar. Add a decision-log entry: the part locked to Conformance, with the rule id, the PR, the approver, and the eval re-run. That part is now Conformance. OpenAI's exception applies to it. Neighboring parts that are still Expression stay there. LangChain: "Once we pick a direction, the approved storyboard becomes the spec the rest of the film is built against."

When an accepted Decision on that part already has shipped Evidence, that part wins on conflict. OpenAI's own exception:

> Exception: If working within an existing website or design system, preserve the established patterns, structure, and visual language.

If the product shipped Inter, or a purple brand, that part stays Conformance. An ExpressionPrior does not override it. A part with no such Decision may still use the prior.

ExpressionPrior fields: `id`, `source` (`anthropic`, `openai`, or `emil`), `statement`. They are rung 6, outside the Pack. They are active for a part in Expression. They are subordinate, per part, wherever an accepted shipped Decision exists. There is no `interview` source. There is no mode field on the prior. Greenfield intent from Interview is a Decision.

Generic UI is what the model emits when the Pack is silent. Anthropic and OpenAI are the starting ExpressionPriors for that failure. Emil is the starting shape for aspect Skills.

Anthropic, on an unguided landing page: models "almost always conform to Inter fonts, purple gradients on white backgrounds, and minimal animations." They name the cause [distributional convergence](https://en.wikipedia.org/wiki/Convergence_of_random_variables): sampling sits on the high-probability center of the training data. Their axes for steering are typography, color and theme, motion, and backgrounds. They also warn that a ban list can create a new local maximum (their example is Space Grotesk). Name the product's own alternatives. Do not swap one generic default for another.

OpenAI, on underspecified prompts: "models often fall back to high-frequency patterns from the training data." Landing-page hard rules are ExpressionPriors: one composition in the first viewport, a hero budget, cardless by default, brand-first, expressive type, atmosphere instead of a flat field. The portable pack pattern is their [`frontend-skill`](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill). Those priors are subordinate, per part, once an accepted shipped Decision exists. OpenAI: "Great design balances restraint with invention—drawing from patterns that have stood the test of time while introducing something new."

The same skill's **Apps** and **Utility Copy For Product UI** sections are Wiki guidance for a product surface. They live in the Wiki. See [Knowledge layers](#knowledge-layers). So do the named tokens and type roles. For a part in Conformance they are filled with what shipped. OpenAI also asks for real copy and product context instead of placeholders, and for a mood board or visual references before final assets when the visual direction is underspecified. A mood board is an input for a part in Expression. For a part in Conformance, the user-supplied product context and the PRD are the ground.

OpenAI notes that low or medium reasoning often produces stronger frontends on simpler pages, with room to turn reasoning up for ambitious work. That is a generator setting in the harness. It does not move the one-pager's Critic off a bigger model.

**Aspect Skills.** [Emil Kowalski](https://emilkowal.ski/ui/agents-with-taste): "My way of getting there is to create a skill file for each aspect of the interface. If you know what great feels like, describe the rules, then give them to your agents so they can follow them." Each file says why the choice feels right, then a strict table or flowchart so the agent does not invent a rule. His easing example: "This is strict so the agent doesn't have to guess or make up its own rules." He uses Anthropic's [skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) to package that.

Compose aspect Skills under the Router. The Router is job-scoped. Vercel request modes are resolved before it runs. The aspect Skill is the specialist for one Angle: animation, typography, color, and the rest of the open set. Why and rules live there. Measurable slices graduate into Gates. Expression-only aspect guidance (distinctive type, anti-slop bans, hero budget) is in force for a part in Expression. For a part in Conformance it waits. Emil: "Of course the more creative part of the job is still up to you." Human acceptance stays in front of a new rule.

## Mode lifecycle (infinity)

Gopi's five rules are locked. The [PRD](prd.md) states them.

1. From scratch, the work is Expression.
2. Once a part is defined, agreed, and shipped, it is Conformance. One Pack, the same artefacts. There is no separate Expression tree and no separate Conformance tree.
3. When Conformance cannot justify the next step from the artefacts, that part enters Expression again.
4. Otherwise Conformance keeps looping.
5. The whole Pack never flips. Parts update.

**How the techniques carry the state.**

- Vercel: Decision status, shipped Evidence, CoverageGap, open decisions, and the authority ladder are the per-part state. The decision log records the move.
- OpenAI: "Great design balances restraint with invention—drawing from patterns that have stood the test of time while introducing something new." The exception: an existing design system wins for that part once an accepted, shipped Decision exists.
- LangChain: "Once we pick a direction, the approved storyboard becomes the spec the rest of the film is built against." That is the lock-back. An accepted, shipped Decision is the spec for that part.
- Anthropic's four steps stay the same. The source of the concrete alternatives switches. Shipped Evidence on a Conformance part. Elicited intent on an Expression part.

**Granularity.** State is carried per Decision and rolled up per surface or Angle. A surface can mix Conformance parts and Expression parts. The Pack does not flip.

**No switcher.** There is no process that flips a mode field. The move is the existing review packet, a human acceptance, and shipped Evidence. Vercel: new standards, policy choices, and unresolved product decisions stay with people. A candidate stays pending until a human approver accepts. Who initiates the proposal, a human or the harness, stays open in the one-pager. This file does not invent that.

### What both lobes share

One system. The lobes differ only in where the concrete alternatives come from, and in whether rung-6 priors are active for that part.

| Shared piece | What it is |
| --- | --- |
| Vercel tree | `AGENTS.md`, `SKILL.md`, references, exemplars, coverage gaps, evals. One tree for both lobes. |
| Decision lifecycle | `proposed`, then `accepted`, then shipped Evidence, or `rejected` / `superseded`. This is the state carrier. |
| Derived part state | Computed from those Vercel fields. Not an authored `mode`. |
| Authority ladder | The resolver. Rungs 3–4 justify staying in Conformance. Rung 5 may still propose on that path (engineering reading). Rung 6 is ExpressionPriors, outside the Pack. |
| Propose contract | Sweep (alternatives = shipped) and Interview (alternatives = elicited) both write `proposed` Decisions, CoverageGaps, and candidate Gates, then stop for a human. |
| Entry Skill | Operating contract, request modes, the seven-step workflow, the product-decision brief, the reachable-state map, the verify checklist. |
| Router, aspect Skills, Wiki | LangChain, Emil, Anthropic. Loaded for either lobe. |
| Learn | One sink. Fast and slow loops. Collector, judge, review packet, human. Dev first-pass comments and production signals, recorded as Evidence. |
| Critic brief | Role, context, file ownership, how to validate, model and effort. Findings are P0–P3, plus Emil's before/after table. |
| Gates | Repo linter and CI. They enforce accepted Decisions. A proposed Decision's candidate Gate is a warning at most (engineering reading, not a product lock). |
| Evaluate | With and without the Skill, holdouts, `rule_correctness` separate from similarity. |
| Decision log | What changed, why, source, approver. An ∞ move is an entry. |
| Rules-expire hygiene | A model upgrade removes workaround prose and matching MemoryLessons. It does not expire a Decision. |

### Still with North

These are product questions. This file does not answer them.

- What "shipped" means: merged, released, or stable for some period.
- Who the approver is per product, and how the user is told that a part entered Expression.
- Whether an Expression part may be implemented before its Decision is accepted.
- Whether `known_flaws`, or a deliberate wish to break a shipped pattern, can send a part to Expression, and how that sits with "shipped wins."
- The user-facing unit of the ∞: surface, feature, or PR. Engineering stores state per Decision either way.
- The threshold for "from scratch" when a little UI has already shipped.

The [PRD](prd.md) open questions now include this list, plus who initiates a mode change and how sharp "artefacts can't justify" must be. Detection in this file is the entry Skill's justification check: which evidence supports the decision. Acceptance is human. This file does not add a who-flips rule beyond Vercel's "new standards stay with people."

Anthropic's other point is the Conformance reading: a custom Skill can encode the organization's design system and component patterns as a reusable asset, loaded on demand. That is the product Pack. The generic frontend-aesthetics skill is not a substitute for it.

## Gates and linters

Use a Gate when code can identify the failure reliably. Leave the judgment on the Decision when it needs product context. The default gate path is the target repo's linter and CI. MCP `run_gates` is optional. Vercel Agent also runs the repo's builds and tests in a sandbox before it posts a suggestion. Flow B does that validation before the Critic, using the harness the product already has.

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

**Engineering reading, not a product lock.** Gates enforce accepted Decisions. A `proposed` Decision's candidate Gate is a warning at most. It does not block the build.

## Critique and Evaluate

**Critique.** The Critic is a review subagent in the user's harness. The one-pager puts it on a bigger model. Anthropic's article does not specify a critic. It reviews generator output (generate–review). The GAN metaphor is historical only. It runs in the adapter's Review mode. It cites the references it loaded. It does not edit unless asked. How many passes run is not locked. Changing the pass count does not change Sweep.

The [PRD](prd.md) asks for outside judges. That is why the Critic and Evaluate's judge stay off the generator's turn.

**Critic brief.** LangChain, for each task: "a clear brief covering its role, relevant context, file ownership, and how to validate the work." The main agent also selects the model and the effort for that task. The Critic brief uses that shape.

| Brief part | What the Pack supplies |
| --- | --- |
| Role | Review the generator's UI change. Edit only when the request mode asks for edits. |
| Relevant context | The references the skill loaded, the Decisions, the Exemplars (including known flaws), the Gates, and the Rubric. |
| File ownership | The files in the change. The subagent writes findings. It writes those files only when edits were asked for. LangChain's subagents "each writing only the files it owns." |
| How to validate | Vercel's verify checklist and the rendered check below. |
| Model and effort | The one-pager's bigger model for the Critic. Effort follows the size of the change. OpenAI's note that low or medium reasoning often helps simpler pages is a generator setting, not this review. |

**Findings.** Vercel: lead with user impact. Each finding is a CriticFinding: location, verification, canonical source, user consequence, and the smallest concrete fix. Starting severity labels, from Vercel, until a dogfood review shows a better scale:

- **P0:** blocks the primary task, creates severe accessibility failure, or can cause unrecoverable user harm.
- **P1:** likely task failure, misleading consequence, missing critical state, or major responsive/accessibility defect.
- **P2:** meaningful friction, inconsistency, weak hierarchy, or recoverability issue.
- **P3:** minor craft or consistency improvement.

**Before/after table.** Emil, when a skill reviews a change: "a clear list of issues based on the rules I defined and a before and after table of what has changed." The Critic returns that table beside the CriticFindings. The table is review output. It is not a new schema.

**Rendered check.** Vercel: "Source inspection establishes behavior; a rendered interface establishes visual and interaction quality. Never claim visual verification from code alone." The Pack instructs the harness to verify the rendered surface, including materially changed states. [OpenAI's Playwright / computer-use note](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4) is one way a harness can do that. Taste does not ship a browser. A CriticFinding with `verification: rendered` requires that check.

**Evaluate.** Product evals, adopted from Vercel's guidance evals. They measure whether the Pack improves harness UI work. A judge step the harness runs checks the edit. The PRD's outside judges keep that judge off the generator. LangChain's "future jobs read and rate those lessons" is the memory loop, not this judge. Vercel's `copywriting-eval` is a narrower copy check. It is not this loop.

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

`angle_id` and `superseded` are Taste glue the template does not have. There is no `mode` field. Part state is [derived](#derived-part-state) from status and shipped Evidence. The Pack loader sets `angle_id` from the reference file the record lives in. It does not set a mode. Vercel's template statuses stay `proposed`, `accepted`, and `rejected`.

The reference file around this record uses the [rule reference template](#entry-skill). When the same decision shows up and the Pack does not contain it, the agent writes this record into the narrowest file and leaves it pending. It does not silently invent a universal rule. When that missing decision is material and rungs 3–4 do not justify it, the write is the rule-3 path: CoverageGap, `proposed` Decision, Shape or Interview.

## Decision log

Vercel, on the update loop: "Keep a decision log that records what changed, why, and which source supported it. Treat new rules as product changes, reviewing and testing each one, and removing those that stop helping."

A log entry is that record. It is not a domain type.

| What the log records | Where it comes from |
| --- | --- |
| What changed | Vercel. The Decision, Gate, Skill, Wiki fact, or Rubric that changed. |
| Why | Vercel. |
| Which source supported it | Vercel. An Evidence locator: PR, commit, path, review, or preview. |
| Approver | Vercel's human review: "Require stable evidence, explicit scope and exceptions, and an approver." |
| Eval re-run | Vercel evals. When fixtures exist, run them with the Skill and without it, and keep both JudgeResults. Read `rule_correctness` and `similarity_to_shipped` as separate numbers. Read `skill_loaded` before blaming a Decision for a miss. |

**Infinity entries.** Two moves are log entries. They are not a new type.

- Part entered Expression. Record the CoverageGap id and why the artefacts did not justify the decision.
- Part locked to Conformance. Record the rule id, the shipping PR (or commit or path), the approver, and that Evaluate was re-run.

LangChain sits next to that log, not inside it. After a job, up to five evidence-backed lessons are stored against the skill used. "Future jobs read and rate those lessons." A weekly pass promotes the useful ones into a Skill or the Wiki. Rating a lesson is not the Vercel judge.

Removing a rule that stops helping is a human edit. Set the Decision to `rejected` or `superseded`. Do not mark it `expired` because a model got better. Expiry is for Skill-prose workarounds and MemoryLessons.

**Modularity.** The table below is guidance for which layer a change touches. It is Taste's software structure, not a sourced technique, and it is not a change-note schema.

| If you need to change… | Touch | Leave stable |
| --- | --- | --- |
| A judgment | Decision (and the adapter file that stores it) | Gate engine, Critic protocol, schemas |
| A mechanical check | Gate | Decision statement |
| How a job is done | Skill or Router row | L1 field names |
| What success means | Rubric dimension | EvalFixture before/after bytes, unless the fixture itself is the change |
| Review behavior | Critique brief | Sweeper outputs |
| Where files live | Pack adapter id | The other PackManifest fields, if a derived view is in use |
| A part's lifecycle state | That part's Decision status, its Evidence, or its CoverageGap | Every other part. There is no Pack-level mode to flip. |
| A model workaround that no longer helps | The Skill prose, or MemoryLesson status `expired` | Decisions, and the principles on L0 |

## Dogfood appendix

L4 bindings. They pass a repo path into Sweep. They do not appear on Pack schemas.

| When | Surface | Where its parts start | What the harness runs |
| --- | --- | --- | --- |
| Now | HelloAlly ally-platform | Mostly Conformance once Sweep Decisions are accepted and have shipped Evidence. A net-new part the artefacts cannot justify goes through Expression (rule 3). | First pain: flow and interaction. Sweep proposes. Day-to-day UI on a Conformance part uses the entry Skill. Interview runs for parts in Expression. Critic and Evaluate run against this Pack. |
| Now, in parallel | omnipresent, or another greenfield surface | Expression (rule 1). Parts lock to Conformance as they ship. | Interview proposes into the same Vercel tree. Same gates, Critic, and product evals. |

Ally is one dogfood Pack, not a mode flag for the product. Omnipresent, or another greenfield surface, is a second dogfood Pack that starts from scratch. Product thinking stays harness-agnostic and product-agnostic. Flow and interaction on Ally use Vercel's product-decision brief and the reachable-state map (loading, empty, error, permission, disabled, optimistic, stale, destructive, responsive, and the rest of that list). Those steps do not add Ally fields to a schema. Parallel product evals run on each dogfood Pack: with and without the Pack, and whether the first pass is mergeable. That measurement is not a separate system. See [Mode lifecycle](#mode-lifecycle-infinity).

Discovery is dual-track. Sweep followed by historical replay is one path. It is not locked as the only path.

## Open questions

Not locked, on purpose:

- The final abstract set of Angles.
- The MCP tool surface. The stub names in this doc are Taste glue, agent-authored starting names, not from sources. They are not a locked tool surface. The sourced rule is LangChain's: tool descriptions matter, and MCP tools sit behind search.
- How many Critic passes run. The brief headings are LangChain's: role, relevant context, file ownership, how to validate, and model and effort. The bigger model is the one-pager's. The GAN metaphor is historical only.
- What "shipped" means, who the approver is, whether an Expression part may be built before acceptance, whether a known flaw or a deliberate break can enter Expression, the user-facing unit of the ∞, and the threshold for "from scratch" when a little UI already shipped. Listed under [Still with North](#still-with-north) and in the [PRD](prd.md) open questions. This file does not answer those.
- Whether Sweep to historical replay is the only discovery path.
- Whether further engineering sources should still change this architecture before it is locked. This draft re-homes Vercel, OpenAI, and Emil on top of the LangChain and Anthropic baseline. The set is not closed. More research may refine it.
- How Sweep tells a deliberate pattern from an accidental or legacy one.
- What Evaluate proves a mergeable first pass without hand-labelling.
- Lessons live in one Learn sink on the Pack. They are not split into an Ally track and an Expression track.
- The MemoryLesson file layout and the slow-loop cadence. The fast and slow loops are in scope, including up to five lessons, a skill association, and a later rating. The file layout is not. LangChain does not define the rating scale.
- LangChain's 200-line bound applies to the memory-layer `AGENTS.md` that loads on every call. The one-pager asks for a bounded repo index and does not set that number. Neither number is a Taste cap.

## Bibliography

What this architecture takes from each source. Quotes above are from these texts. Each source is a starting-base PoC, re-homed under the L1 types.

### LangChain — Content Studio

- Article: [Building a design agent](https://www.langchain.com/blog/design-agent)
- Open source: [langchain-ai/design-agent](https://github.com/langchain-ai/design-agent)
- Took: job-scoped Skills behind a Router; a Wiki that Skills link to; Gates in code for measurable checks; fast memory in the same turn and a slow loop (up to five lessons, associated with the skill, future jobs read and rate them, weekly promotion); two memory layers, shared and personal; judgment in prompts and invariants in code; the guidance stack of tokens, principles, anti-slop guardrails, and the reasoning behind feedback; subagent briefs (role, relevant context, file ownership, how to validate, model and effort); tool descriptions, with MCP tools behind search; storyboard then animatic then production, and "Once we pick a direction, the approved storyboard becomes the spec the rest of the film is built against" as the lock-back precedent; workaround rules expire after model upgrades ([Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)); the 200-line bound on the memory-layer `AGENTS.md`; harness_v1's 115-component design system, which became repetitive. The harness owns the loop. Taste does not adopt Content Studio's media computer or Slack product. LangChain is not the source of the eval judge.

### Anthropic — frontend skills

- Article: [Improving frontend design through Skills](https://claude.com/resources/articles/improving-frontend-design-through-skills)
- Took: distributional convergence as the reason unguided UI looks generic; Skills as on-demand context; prompt altitude between hardcoded values and vague praise; axes of typography, color and theme, motion, and backgrounds; the four-step method (identify convergent defaults, provide concrete alternatives, right altitude, reusable Skills); a compact skill, their frontend prompt at about 400 tokens; skills that carry scripts (web-artifacts-builder); custom Skills as the way an organization encodes its own design system. Generic aesthetics are ExpressionPriors. A custom Skill that encodes the shipped system is Conformance. The article does not specify a critic model.

### Vercel — product-design

- Article: [Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel)
- Took: the default Pack adapter (skill plus linters plus a human review loop); the entry Skill's operating contract and seven-step workflow, including the product-decision brief, the reachable-state map, and the verify checklist; request modes resolved before routing; the rule reference template; references, Exemplars, and CoverageGaps; Gates for deterministic rules and prose for judgment; sandbox validation with builds, tests, and linters before a suggestion; Evaluate (before state, judge, Rubric, shipped examples, holdouts on fixtures, with/without-skill baseline, correctness scored separately from similarity); the first-surface quote and the Decision template; Learn as collector, judge, review packet, and human acceptance into the narrowest destination; the decision log (what changed, why, which source, approver); Decision status, shipped Evidence, CoverageGap, and the authority ladder as the per-part ∞ state.

### OpenAI — delightful frontends

- Article: [Designing delightful frontends with GPT-5.4](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4)
- Pack pattern: [`frontend-skill`](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill)
- Took: underspecified prompts fall back to high-frequency patterns; "Great design balances restraint with invention—drawing from patterns that have stood the test of time while introducing something new"; landing-page hard rules (hero budget, cardless default, brand-first, expressive type, atmosphere) as ExpressionPriors; Apps (Linear-style restraint) and Utility Copy for product UI as Wiki guidance for a part in Conformance; named tokens (`background`, `surface`, `primary text`, `muted text`, `accent`) and type roles (`display`, `headline`, `body`, `caption`); the exception that an existing design system wins, applied per part; ground the work in real copy; visual references and a mood board; rendered verification with Playwright across viewports and flows; low or medium reasoning as an optional generator setting. The article does not describe a component library for agents.

### Emil Kowalski — agents with taste

- Article: [Agents with Taste](https://emilkowal.ski/ui/agents-with-taste)
- Took: one Skill file per interface aspect; articulate why a choice feels right; strict tables and flowcharts the agent can follow; package that experience so the agent stops guessing; a review that returns a list of issues and a before/after table; the creative part of the job stays with the person. Aspect Skills sit under the Router. The article does not define memory, corrections, or a design-system replacement.

### Product

- [docs/prd.md](prd.md), mirroring [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) (Gopi · Draft · Oct 2026). Took the ambition bar: judgment carried across harnesses and model upgrades, and outside judges. Outside judges keep the Critic and the Evaluate judge off the generator. The Doc now states the five ∞ rules: from scratch is Expression; defined, agreed, and shipped is Conformance on one Pack; Conformance returns to Expression when the artefacts cannot justify the next step; otherwise Conformance keeps looping; the Pack never flips, parts do. Who initiates a mode change stays open there. This file follows those rules and does not invent the initiator.
