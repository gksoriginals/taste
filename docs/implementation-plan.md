# Taste plugin v1 implementation plan

This plan describes a usable first version of Taste as a plugin for an existing coding harness. The harness remains the coding agent and owns models, mode reasoning, repository access, execution, and subagent delegation. Taste provides portable product Skills, Pack operations, and evaluation data tools. The architecture can change when dogfooding shows that a product intent is not being met.

## Milestones and acceptance

### 1. Portable harness plugin — complete

- Package Skills and a local MCP server using the Agent Plugins root format for Codex and Cursor.
- Provide Claude Code native compatibility metadata over the same Skills/server.
- Validate manifests and document local development. Do not configure or host an agent.

### 2. Product Taste Pack — complete

- Initialize a non-overwriting `taste/` Pack with shared, Conformance, and Expression knowledge, product authority, and eval rubric/fixture locations.
- Product entry Skill explains mode selection and transitions from task intent and product-specific triggers.
- Keep transient working memory in harness/plugin storage; version product-wide reviewed knowledge in the product's `taste/` directory.

### 3. Pack discovery and upkeep — complete

- Inspect, read, validate, and safely update files in the product Pack.
- The Taste Pack Skill guides evidence gathering from shipped examples, Git/review history, and product sources; asks the harness/user for access when needed; distinguishes observation, inference, flaw, and accepted decision.
- Acceptance: a host agent can inspect an existing Pack, draft a scoped skill/reference from evidence, write it under `taste/`, and validate it without Taste editing harness instructions. The MCP Pack write operation is confined to the Pack, rejects symlink parents, and has a size limit.

### 4. Paired evaluation and Judge workflow — complete

- Store shipped-example fixtures as task + before/after states, mode guidance, and a Rubric. Include holdouts whose expected changes are absent from generator context.
- Compare with-Skill and without-Skill generation from equivalent isolated starting states; record loaded guidance and retrieval traces.
- Delegate judging to a higher-capacity harness subagent in a fresh context after generation. Score user-facing quality, product-rule application, and similarity to shipped work separately; treat known flaws as counterevidence. Human review calibrates and adjudicates.
- Acceptance: the generator packet contains no expected-after state; each Judge packet contains task, one generated output, expected state, and Rubric. The evaluation Skill defines the paired-run and result-record fields to retain in harness/plugin working memory outside the portable Pack. A synthetic smoke run used independent generator contexts and a fresh higher-capacity Judge context.

### 5. End-to-end verification — complete for v1

- Test Pack initialization, upkeep, path safety, both modes, eval fixture separation, MCP stdio, and plugin manifests.
- Verify supported harnesses where installed; distinguish schema/protocol validation from a live IDE acceptance test.
- Acceptance: repeatable code and protocol checks cover plugin manifests, MCP loading, Pack initialization/upkeep, both modes, paired fixture packets, and Judge handoff. The synthetic smoke evaluation confirmed the separate-context workflow and produced actionable rubric feedback. Harness-specific installation UI checks remain limited to the installed tools described in `docs/plugin-development.md`.

### 6. Setup, sweep, interviews, and mode routing — complete for v1

- Make a live browser/computer product sweep a required part of Conformance knowledge discovery; capture page, flow, screenshot/rendered state, date, and viewport evidence, plus source/history corroboration.
- Ask Expression questions through the existing coding harness, summarize user intent, and require confirmation before recording an accepted direction.
- Define named workflows and their manual/automatic triggers across harnesses.
- Resolve the coding agent's structured intent signal through deterministic mode-transition logic. Do not classify raw language in Taste code.
- Acceptance: setup creates both mode routes; the sweep Skill requires screenshots and marks missing access/evidence incomplete; Expression questions go through the harness and need confirmation before recording accepted direction; ambiguous intent returns a focused harness question; the deterministic resolver maps LLM-selected structured signals without classifying raw language.

## First-version boundaries

Taste does not implement an agent runtime, provider-specific subagent protocol, automatic access to production data/Git history, a universal eval runner, or an evaluation database. Skills instruct the harness coding agent; the MCP tools provide deterministic Pack and fixture operations; the harness delegates to its own higher-capacity model and stores transient run records in its own working memory. A host lacking the required delegation must report that limitation rather than silently substitute same-context judging.

## Delivered v1 capabilities

- Root Agent Plugins package, Codex repo marketplace catalog, and Claude Code native compatibility metadata.
- Seven plugin Skills: UI task routing, Pack upkeep, setup, visual sweep, Conformance, Expression, and evaluation.
- Nine MCP tools: mode resolution; Pack initialize, inspect, read, write, validate; fixture listing; generator input; and one-output Judge packet.
- Starter and synthetic example Packs with shared, Conformance, and Expression references, authority notes, Rubric, and fixtures for each mode.
- Path and symlink confinement, non-overwriting initialization, bounded reads/writes and fixture states, manifest validation, tests, and local development instructions.

The synthetic two-arm smoke test is demonstration of harness flow only. The expected product result and product guidance are fabricated examples, so its scores cannot be used to claim that Taste improves real product work.
