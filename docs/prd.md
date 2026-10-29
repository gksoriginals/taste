# Taste

**Draft · Oct 2026 IST**

The [Google Doc](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) (*Taste: One-Pager*, Gopi · Draft · Oct 2026) is the source of truth. This file mirrors it. If they diverge, the Doc wins.

## Hard goal

From what's shipped, extract the product's taste across every design angle (style, fonts and typography, themes and tokens, UX, interaction, flow, copy, and more), so any coding harness, given a PRD and the Taste pack, first-passes UI you'd merge. No long design prompts. No re-teaching each screen. Experiments will find the abstract set of angles.

Ambition bar (North manifesto): agents carry and extend a specific product's design judgment across harnesses and model upgrades. Altitude: outcome over task. Depth: expert methods on raw material, outside judges. Range: multiple fields, verbs not nouns.

## Why now

- Good designs rarely land on the first pass without heavy nudging.
- On existing products, agents miss parts of the established design: on Ally, UX and interaction nuances; in other harnesses, existing style and format such as fonts and typography.

## What Taste is / isn't

- Is: a portable design-taste layer for coding agents: a pack in the repo, an MCP server, and agents that build and maintain the pack.
- Isn't an agent runtime. The harness owns the loop, planning, and model; Taste supplies context, tools, and checks.
- Isn't a component library, and won't become a design system product.
- Who for now: Gopi dogfooding; built for software-product UI projects generally.

## Baseline architecture

LangChain (Content Studio) and Anthropic's frontend-skills article are the v0 baseline and current source of truth. Follow them first; don't invent a different architecture. This baseline is not presumed final: architecture gets locked after more research into similar engineering docs and experiments.

- Taste documented as skills, as LangChain's designers do: job-scoped skills behind a router.
- A wiki that skills link to, not copy.
- Judgment in prompts, invariants in code: gates for anything measurable.
- Memory with a fast loop (corrections saved in the same turn) and a slow loop (lessons promoted later).
- Anti-default guidance against distributional convergence.
- Rules expire: delete compensating rules after model upgrades.
- AGENTS.md as a bounded index; growth goes into skills and the wiki.

## Conformance and expression

Conformance first: match the judgment the product has already shipped, across every design angle. Expression is deferred. Lifecycle: once expression is closed and the user has locked a design, Taste switches to conformance; the exact trigger is still open. HelloAlly ally-platform is the dogfood surface only, where flow and interaction are the first pain; product thinking stays harness- and product-agnostic.

## How taste gets in and is checked

- Interviewer: elicits intent and reasoning on greenfield work.
- Sweeper: extracts every design angle it can find in a shipped product.
- Learner: captures judgment calls and corrections as they happen.
- Critic: a review subagent in the user's harness, on a bigger model with carefully crafted prompts and skills, reviews each design pass. GAN-inspired for now (generator vs critic); may change later.

Shipped is the source of truth: when stated preferences conflict with what's shipped, shipped wins.

## First experiments

- Conformance on HelloAlly ally-platform now.
- Expression on omnipresent later.
- Dual-track discovery: Sweep to historical replay is not locked as the only path.

Success signals:

- The first pass is mergeable.
- No long design prompts needed.
- No re-teaching per screen.
- Suggested: track gate pass rate and a with/without-pack comparison on past Ally UI changes, as one optional path, not the only one.

## Non-goals

- Not an agent runtime.
- Not a component library or design system product.
- Not OpenSignal: OpenSignal doesn't own design judgment.
- Not expression mode, yet.

## Open questions

- Suggested: How does a sweep tell deliberate design patterns from accidental or legacy ones?
- Suggested: What eval proves a mergeable first pass without hand-labelling?
- Suggested: Which conformance learnings carry over once expression starts on omnipresent?
- What signal shows expression is closed and the design is locked, so Taste switches to conformance?
- Which abstract set of design angles holds across products?
- Which other engineering sources should shape the architecture before we lock it?
