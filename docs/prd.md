# Taste

**Draft · Nov 2026 IST · workflow update Nov 1**

The [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) (*Taste: One-Pager*, Gopi · Draft · Oct 2026) is retained as a reference and has not been updated for the Nov 1 workflow decisions. This local PRD records the current implementation direction; reconcile or remove the external document later.

## Hard goal

From what's shipped, extract the product's taste across every design angle (style, fonts and typography, themes and tokens, UX, interaction, flow, copy, and more), so any coding harness, given a PRD and the Taste pack, first-passes UI you'd merge. No long design prompts. No re-teaching each screen. Experiments will find the abstract set of angles.

Ambition bar (North manifesto): agents carry and extend a specific product's design judgment across harnesses and model upgrades. Altitude: outcome over task. Depth: expert methods on raw material, outside judges. Range: multiple fields, verbs not nouns.

## Why now

- Good designs rarely land on the first pass without heavy nudging.
- On existing products, agents miss parts of the established design: on Ally, UX and interaction nuances; in other harnesses, existing style and format such as fonts and typography.

## What Taste is / isn't

- Is: a plugin for coding harnesses (Cursor, Codex, Claude Code). Skills and MCP tools drive the harness. The Pack lives in the product repo (`taste/`), not in this plugin repo.
- Isn't an agent runtime, and isn't a daemon. The harness owns the loop, planning, and model. Taste supplies context, tools, and checks.
- Isn't a component library, and won't become a design system product.
- Isn't a hard CI gate. Gates are out of scope for the current milestone.
- Who for now: Gopi dogfooding on any software-product UI repo. Ally is a historical dogfood surface, not a blocker.

## Current harness promotion flow (Nov 1 update)

The host harness owns implementation, tests and linters, readiness decisions, user review, and push. Taste does not run or observe those workflows. Keep early feedback, exploratory drafts, rejected iterations, and unresolved gaps in the host's active task context. When the user likes an early direction, the Taste skill nudges the host to continue its own workflow; that reaction is not approval of final Pack guidance.

Record or update a Decision only after the host reports that its relevant checks passed and the user approves both the exact tested artifact and the Decision. Taste stores this host-reported evidence without verifying the claims. Conformance additionally requires shipped evidence and no coverage gap. Before shipping, an otherwise accepted and validated Decision remains Expression until shipped evidence is added. An optional `decisionPromotionCheckpoint` in `taste/manifest.json` supplies reminder text for when the host should call Taste; it does not configure or trigger the host workflow. Each host may choose its own checkpoint timing relative to push. Learning from interaction history beyond the finally approved artifact remains a later experiment tracked in [issue #7](https://github.com/gksoriginals/taste/issues/7).

## Harness loop

Skills and MCP tools drive four steps. The harness stays in charge.

1. **Setup.** Initialize one Pack under the product repo.
2. **Explore judgment.** Sweep an existing UI, and/or Expression-interview a greenfield or a gap. Keep candidate judgments in the host task while exploring.
3. **Design with the Pack.** When the user asks for UI, load the Pack first. Conformance uses Decisions with matching validation and approval evidence, shipped evidence, and no coverage gap.
4. **Promote through Expression.** After the host reports checks passed and the user approves the tested artifact and Decision, record the accepted Decision in the Pack. The host owns the timing and workflow.

Pack state and user intent route work between the existing Expression and Conformance activities. Success for this milestone is that path running end to end on a real product repo. It does not have to be Ally.

## Baseline architecture

LangChain (Content Studio) and Anthropic's frontend-skills article are the v0 baseline and current source of truth for the knowledge layer. Follow them first; don't invent a different architecture. This baseline is not presumed final: architecture gets locked after more research into similar engineering docs and experiments.

- Taste documented as skills, as LangChain's designers do: job-scoped skills behind a router.
- A wiki that skills link to, not copy.
- Judgment in prompts, invariants in code: gates for anything measurable. Hard CI gates are still out of scope for this milestone.
- Memory may include fast and slow learning loops, but this milestone records only a tested artifact and Decision after host-reported checks and user approval. Learning from interim interaction history is deferred to issue #7.
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

Engineering derives per-part activity from Decision status, matching validation and user-approval evidence, shipped Evidence, and CoverageGap. There is no authored mode field. The user liking an early direction nudges the host to continue its workflow; it is not approval to promote a Decision.

**Expression is the learner.** One Expression skill interviews, walks requirements and conversation, and writes new signals into the Pack. Corrections on shipped or generated work are the same Expression path with different triggers (coverage gap, or a rejected pass), not a separate Learner product.

**Conformance** uses accepted, shipped taste for UI work. **Expression** elicits and writes the Pack for gaps, greenfield, and new judgment.

HelloAlly ally-platform remains a conformance dogfood surface in the one-pager (flow and interaction first pain). Omnipresent stays a greenfield Expression surface in that note. Neither is required for this milestone. Product thinking stays harness- and product-agnostic.

## How taste gets in and is checked

- **Expression (the learner):** elicits intent on greenfield work and walks new requirements. Interim feedback, gaps, and rejected passes stay in the host task; the Pack is updated only after the final tested artifact and Decision are approved.
- **Sweeper:** extracts candidate design angles from shipped UI for discussion in the host task. It does not write proposed Decisions to the Pack.
- **Critic:** a review subagent in the user's harness, on a bigger model with carefully crafted prompts and skills, reviews each design pass. GAN-inspired for now (generator vs critic); may change later.

Shipped is the source of truth: when stated preferences conflict with what's shipped, shipped wins. How that sits with known flaws is still an open question below.

## First experiments

- Conformance on HelloAlly ally-platform, as recorded in the one-pager.
- Expression on omnipresent (greenfield start); Expression pockets anywhere the artefacts cannot justify the next step.
- Dual-track discovery: Sweep to historical replay is not locked as the only path.
- This milestone: the plugin, installed in a coding harness, runs setup → Expression or Sweep → UI with the Pack → host checks and user approval → finalized Decision recorded, on a product repo that need not be Ally. No daemon. No hard CI gate.

Success signals:

- The first pass is mergeable.
- No long design prompts needed.
- No re-teaching per screen.
- Suggested: track gate pass rate and a with/without-pack comparison on past Ally UI changes, as one optional path, not the only one.

## Non-goals

- Not an agent runtime and not a daemon.
- Not a component library or design system product.
- Not OpenSignal: OpenSignal doesn't own design judgment.
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
