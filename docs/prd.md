# Taste

**Draft · Nov 2026 IST · workflow update Nov 1**

This document is the product source of truth. An earlier author-private draft is optional, not maintained, and not required reading. It does not override this PRD.

## Hard goal

From what's shipped, extract the product's taste across every design angle (style, fonts and typography, themes and tokens, UX, interaction, flow, copy, and more), so any coding harness, given a PRD and the Taste pack, first-passes UI you'd merge. No long design prompts. No re-teaching each screen. Experiments will find the abstract set of angles.

Ambition: agents carry and extend a specific product's design judgment across harnesses and model upgrades. Altitude: outcome over task. Depth: expert methods on raw material, outside judges. Range: multiple fields, verbs not nouns.

## Why now

- Good designs rarely land on the first pass without heavy nudging.
- On existing products, agents miss parts of the established design: UX and interaction nuances on some products, and existing style and format such as fonts and typography on others.

## What Taste is / isn't

- Is: a plugin for coding harnesses (Cursor, Codex, Claude Code). Skills and MCP tools drive the harness. The Pack lives in the product repo (`taste/`), not in this plugin repo.
- Isn't an agent runtime, and isn't a daemon. The harness owns the loop, planning, and model. Taste supplies context, tools, and checks.
- Isn't a component library, and won't become a design system product.
- Isn't a hard CI gate. Gates are out of scope for the current milestone.
- Who for now: anyone trying Taste on a software-product UI repository. No particular product is required.

## Current host learning flow (Nov 3 update)

The host harness owns implementation, tests and linters, self-review, and push. Taste does not run or observe those workflows. The host learns directly from the user's corrections, rejections, and disagreements during design, applies the feedback, and records clear reusable lessons as scoped checklist items. Do not require a separate developer or human review or a promotion approval step. Keep unresolved options and one-off feedback in the active task.

For Expression tasks that need specialist visual, interaction, UX-flow, or product-decision craft, Taste asks the host to inspect capabilities already available. If none fits, the host explains the gap and asks the user before internet search or installation, presents candidates, and gets approval for the selected install. The host tries approved capabilities and asks whether to keep them; user-approved locks live in the host's product or harness workflow, with identity, version/source, and scope. Taste owns no shortlist, ranking, catalog, or automatic install path. Formal benchmarking is deferred until there are approved locks and measurable evidence.

For first-time setup on a product with existing UI, sweep the whole product, then write a task-and-surface-routed entry Skill, focused references, checklists, and source/coverage metadata after host self-review. The host may delegate bounded surfaces to available tasks or cloud agents and reconciles their work. During later conversations, a resolved user correction, rejection, or disagreement can update a checklist automatically after the host self-checks the result. The user can always correct the host in the ongoing task; no separate Pack or Decision approval is required. `taste_record_signal` remains a legacy structured record path. The optional `decisionPromotionCheckpoint` is not required for the checklist learning loop.

## Harness loop

Skills and MCP tools drive four steps. The harness stays in charge.

1. **Setup.** For a product with existing UI, inventory and sweep the whole user-facing product. The host creates and self-reviews a tailored task-and-surface-routed entry Skill, focused references, checklists, and product metadata, then initializes/populates the Pack. For a greenfield design task with no Pack, defer initialization until reusable guidance emerges.
2. **Explore judgment.** Sweep existing surfaces or Expression-interview a greenfield part or gap. The host may delegate bounded surface inventories to available tasks or agents, then reconciles the evidence. Apply user feedback in the same conversation and turn clear reusable outcomes into checklist items.
3. **Design.** Load the product Skill, focused surface references, and checklist before UI work. Apply any relevant legacy structured Decisions too. Without a Pack, sweep existing UI or use transient Expression for a greenfield task.
4. **Maintain guidance.** After applying user feedback, self-check the changed result and update the relevant checklist when the lesson is reusable. No separate human review or Decision promotion is required.

Pack state and user intent route work between the existing Expression and Conformance activities. Success for this milestone is that path running end to end on a real product repo.

## Baseline architecture

LangChain (Content Studio) and Anthropic's frontend-skills article are the v0 baseline and current source of truth for the knowledge layer. Follow them first; don't invent a different architecture. This baseline is not presumed final: architecture gets locked after more research into similar engineering docs and experiments.

- Taste documented as skills, as LangChain's designers do: job-scoped skills behind a router.
- A wiki that skills link to, not copy.
- Judgment in prompts, invariants in code: gates for anything measurable. Hard CI gates are still out of scope for this milestone.
- Learning has a fast loop: the host captures resolved, reusable user corrections and disagreements as scoped checklist items after applying and self-checking the change. No separate human review or promotion step. Keep unresolved or one-off feedback in the active task.
- Anti-default guidance against distributional convergence.
- Rules expire: delete compensating rules after model upgrades.
- AGENTS.md as a bounded index; growth goes into skills and the wiki.

## Conformance ↔ Expression (∞)

Conformance and Expression are two activities over one Pack, not two products and not a one-way deferral. One Pack, same artefacts — never separate Expression vs Conformance artefact sets. The whole Pack does not flip. Parts update.

Locked loop:

1. Project from scratch → Expression.
2. Once defined, agreed, and shipped → Conformance. One Pack, the same artefacts.
3. When the artefacts cannot justify the next step → Expression again for that part.
4. Otherwise Conformance keeps looping.
5. The whole Pack never flips. Parts update.

Legacy per-part activity derives from structured Decision status, validation/approval evidence, shipped evidence, and coverage gaps. Checklist guidance is loaded independently of that state. There is no authored mode field.

**Expression is the learner.** One Expression skill interviews, walks requirements, applies feedback, and updates reusable checklist items in the Pack. Corrections on shipped or generated work use the same path; no separate review or promotion flow.

**Conformance** applies sourced product guidance and scoped checklists. **Expression** elicits direction for gaps, greenfield, and new judgment, then records clear reusable feedback in those checklists.

No particular product is required for this milestone. Product thinking stays harness- and product-agnostic.

## How taste gets in and is checked

- **Expression (the learner):** elicits intent on greenfield work and walks new requirements. It applies user feedback and, after a host self-check, writes reusable lessons to scoped checklists.
- **Sweeper:** inventories the whole existing UI, builds sourced references/checklists, and self-reviews coverage before writing the Pack.
- **Critic:** a review subagent in the user's harness, on a bigger model with carefully crafted prompts and skills, reviews each design pass. GAN-inspired for now (generator vs critic); may change later.

Shipped UI is evidence, not an absolute rule. The user's explicit correction or preference in the current task takes precedence; the host adapts the work and can update the checklist after self-checking it.

## First experiments

- Conformance on an existing product surface where shipped UI already exists.
- Expression on a greenfield start; Expression pockets anywhere the artefacts cannot justify the next step.
- Dual-track discovery: Sweep to historical replay is not locked as the only path.
- This milestone: the plugin, installed in a coding harness, runs whole-product setup → task-and-surface-routed UI work → conversation-driven checklist learning on any product repo. The host may parallelize bounded surface sweeps. No daemon. No hard CI gate.

Success signals:

- The first pass is mergeable.
- No long design prompts needed.
- No re-teaching per screen.
- Suggested: track gate pass rate and a with/without-pack comparison on past UI changes in a real product, as one optional path, not the only one.

## Non-goals

- Not an agent runtime and not a daemon.
- Not a component library or design system product.
- Not a separate product that owns design judgment. Design judgment stays with the product.
- Not separate Expression vs Conformance artefact sets — one Pack.
- Not a separate Learner product. Expression is the learner.
- Not a hard CI gate for this milestone.
- Not a process for who initiates an ∞ change. That question stays open.

## Open questions

- Suggested: How does a sweep tell deliberate design patterns from accidental or legacy ones?
- Suggested: What eval proves a mergeable first pass without hand-labelling?
- Suggested: How do we detect "artefacts can't justify" sharply enough to enter Expression without thrashing?
- Which abstract set of design angles holds across products?
- What does "shipped" mean for lock-back (merged, released, or stable for a period)?
- Can known_flaws or a deliberate break of a shipped pattern send a part to Expression, and how does that sit with "shipped wins"?
- User-facing unit of the ∞: surface, feature, or PR? (Engineering stores state per Decision either way.)
- Threshold for "from scratch" when a little UI has already shipped?
- Which other engineering sources should shape the architecture before we lock it?
