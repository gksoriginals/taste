# Taste product brief

## What Taste is

Taste is a plugin for coding assistants that helps them make UI changes consistent with a specific product. It provides focused Skills and local tools. The product repository stores its own Taste Pack under `taste/`, so the guidance is versioned alongside the UI it describes.

Taste is not an autonomous coding agent, design system, component library, or hosted service. The host assistant owns the conversation, repository inspection, UI implementation, checks, self-review, and any delegation. Taste provides workflow guidance and safe Pack file operations.

## The problem

Without product-specific context, coding assistants often make plausible but generic UI choices. Users then have to repeatedly explain product conventions, interaction details, copy, and exceptions. Taste gives the host focused, reusable context for the affected task and surface.

## How it works

There is one Pack per product repository. The Pack preserves durable product judgment: decisions and their reasons, tested lessons, and traps discovered through use that a future assistant is unlikely to recover by rereading code or reopening the screen. It links to canonical code, lint, docs, instructions, and rendered behavior instead of copying what those sources already show. Preserve evidence and distinguish observation, inference, and settled intent; give facts that may change enough context to avoid presenting them as timeless rules. Pack shape is product-specific: an entry Skill, surface or task references, checklists, and optional evidence, examples, or evaluation material. The host selects relevant guidance from the request and affected surface rather than loading a universal design taxonomy.

Conformance and Expression describe how the host approaches a task:

- **Conformance** applies relevant, established product guidance.
- **Expression** explores a new direction, addresses an unsupported area, or responds to a user correction. Existing guidance may still apply.
- **Clarify** asks a focused question only when the repository and conversation do not resolve a material ambiguity.

They are not Pack modes or setup states. Packs do not need persistent per-task routing state.

## Setup and learning

**Explicit Setup** (`/taste-setup` where supported, or the `taste-setup` Skill) inspects the repository, identifies product scope, reviews accessible UI and source, and creates or refreshes tailored guidance. It keeps reusable guidance, audit findings, and operational notes distinct. The host asks about scope or access only when repository evidence cannot resolve a consequential choice. Setup records evidence and coverage gaps, resumes without overwriting useful work, and validates the Pack. It does not change product UI.

**Normal UI work** uses the existing Pack where relevant. If the Pack is absent or does not cover the surface, the host can still do the requested work in Expression. For non-trivial UI work, the host writes a short task-local brief before editing product files: the intent, the Pack constraints that apply, and options being rejected. The brief stays in the task.

When a user correction or resolved disagreement establishes a clear reusable lesson, the host applies it and keeps the edit only when the product's existing checks and the relevant Pack checklist show improvement or no regression; otherwise the host reverts and retries. Taste does not run those checks, own a CI gate, or compute the before/after delta. The host may then write the lesson to scoped guidance, preserving evidence and adding rationale or rejected options when they help a future assistant recover the judgment. Unresolved alternatives are not written into the Pack. If needed, the host can create a minimal Pack for that affected surface; this is not a product-wide sweep. One-off reactions stay in the active conversation.

Taste does not observe conversations or decide whether a lesson is reusable. The host makes that judgment and supplies the content to Taste's Pack tools. There is no separate human approval or promotion step for updating scoped guidance.

## Product boundaries

- Keep product guidance in the product repository, not in the Taste plugin checkout.
- Prefer concise, useful lessons with traceable evidence. Do not add rationale or rejected-option sections just to fill a template; retain the context that makes a lesson reusable.
- Treat shipped UI as evidence of current behavior, not proof that every choice is intentional or desirable.
- Do not turn an observed pattern into an intentional rule without evidence for its rationale. When intent is unresolved, ask concisely if the user is available; otherwise omit it or label it as inference.
- Distinguish rendered observations, source facts, design references, and inference.
- Keep setup readiness separate from per-surface coverage; partial Packs must not imply uninspected surfaces are covered.
- Never store credentials, tokens, or real user data in a Pack.

## Current capabilities

The plugin provides Skills for design routing, Conformance, Expression, explicit Setup and sweep, Pack maintenance, and evaluation. Its local MCP server can initialize, inspect, read, write, and validate a Pack; and serve evaluation fixture and judging packets. Filesystem operations are confined to the target repository's `taste/` directory.

The project includes synthetic before/after fixtures and a paired evaluation workflow. These demonstrate the evaluation plumbing, not a measured improvement in real products. There is not yet a verified real-host study establishing that Taste improves UI quality.

## Out of scope

- Running or hosting the coding assistant loop.
- Product-independent default design rules or a mandatory Pack directory taxonomy.
- Automatically sweeping the repository during ordinary UI requests.
- A Taste-owned browser, visual inspection service, CI gate runner, or agent team.
- A claim that the current evaluation proves Taste's effectiveness.

## How we assess progress

Evaluate the same UI task with and without the relevant Pack guidance under comparable conditions. Score task completion, product-rule application, and user-facing quality separately. Use held-out tasks where possible, inspect rendered behavior when relevant, and report sample size and limitations. Treat a judge score as evidence, not ground truth; calibrate rubrics against product-owner judgments before making broad claims.

See [Engineering](engineering.md) for implementation details and [validation results](validation-results.md) for the current synthetic evaluation record.
