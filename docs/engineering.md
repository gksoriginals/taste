# Engineering

**Draft · Oct 29, 2026 IST**

## Status and scope

Initial architecture for experiments. Not presumed final. More research and experiments still have to land before this is locked.

**Product source of truth:** the [Google Doc one-pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit), mirrored in [docs/prd.md](prd.md). If this file and the Doc disagree about the product, the Doc wins.

**Audience:** Gopi and Dev for engineering. North for product alignment only.

**Hard goal:** from what a product has shipped, extract its taste across every design angle so any coding harness, given a PRD and the Taste pack, first-passes UI you would merge. Experiments find the abstract set of angles. See the [PRD](prd.md).

This repository stays docs-only. The pack layout below is the recommended shape for a **target product repo**. It is not a tree to add here. No application code, package manifest, MCP server, or skill files in this repo.

## What experiments can rely on

These are the working assumptions for the experiment track. They are not a final lock.

- The user harness owns the loop. Taste is a pack, an MCP server, and agents. The Critic is a harness subagent.
- Knowledge is split the way [LangChain Content Studio](https://www.langchain.com/blog/design-agent) splits it: job-scoped skills behind a router, a wiki skills link to, gates in code, memory with a fast loop and a slow loop.
- Judgment stays in prompts. Invariants live in code. Compensating rules expire when models improve.
- Conformance extraction starts from the [Vercel product-design](https://vercel.com/blog/teaching-agents-product-design-at-vercel) pack: trigger, modes, references, exemplars, coverage gaps, linters, evals.
- Dogfood is conformance on HelloAlly ally-platform. Expression on omnipresent comes later.
- Shipped beats a stated preference that conflicts with it. A shipped flaw is not a rule to copy.
- Evals: an agent edits a before state, a judge scores a rubric, holdouts and a with/without-skill baseline stay in the loop, and rule correctness is a separate score from similarity to shipped code.
- Pack authors start from one repeated-decision surface and write observable decisions.

## Stack placement

```
User harness (Cursor / Claude Code / Codex / …)
  owns: loop, planning, models, tools, PR workflow
Taste pack (in the target product repo) + optional Taste MCP + Taste agents
  supplies: skills, wiki, gates/linters, memory hooks, critic brief, eval fixtures
Critic = harness subagent (bigger model, GAN-inspired for now)
```

The harness is the runtime. Taste supplies context, tools, and checks. That split follows the PRD and the Content Studio lesson that taste is the designers' judgment written into skills and checks, while the harness owns the loop. Content Studio's sandbox, Slack UX, and media tooling are that product's harness. Taste does not rebuild them.

| Piece | Role in v0 experiments |
| --- | --- |
| Pack | Files in the target repo: skills, wiki, exemplars, coverage gaps, eval fixtures, the critic brief. |
| MCP | Optional tools the harness calls. The tool list is an open question. |
| Sweeper | Extracts a shipped product into the pack. |
| Learner | Captures judgment and corrections, then promotes what holds. |
| Interviewer | Elicits intent on greenfield work. Expression is deferred, so this agent waits. |
| Critic | Review subagent inside the user's harness. Bigger model, crafted prompts and skills. GAN-inspired for now: the coding agent generates, the Critic reviews. The protocol may change. |

Taste is not an agent runtime, not a component library, and not a design-system product. OpenSignal does not own design judgment; Taste does not become OpenSignal.

## Pack shape

Adopt the [Vercel product-design](https://vercel.com/blog/teaching-agents-product-design-at-vercel) tree as the starting point for extracting taste from an existing project. Three parts, as Vercel defines them: an agent skill, linters for clear rules, and a review loop that prepares guideline updates for a human.

Recommended layout in the **target product repo**:

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

Lint rules live in the target repo's existing linter (Vercel uses ESLint). They are part of the pack's gates. This repo does not add a linter package.

| Path | Taste reading |
| --- | --- |
| Repo `AGENTS.md` | When to load the skill. Firm boundary: user-visible UI. Vercel saw agents fail to invoke an available skill in 56% of cases in [separate Next.js evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals). Test the trigger separately from the guidance. |
| Skill-local `AGENTS.md` | Load order, validation, governance. |
| `SKILL.md` | Runtime workflow and request modes. |
| `references/` | Design angles and the decisions on each surface. The abstract angle set is not locked. |
| `exemplars/` | Shipped pull requests: decisions worth repeating, and known flaws. |
| `references/coverage-gaps.md` | Standards the product does not have yet. Sweeper leaves gaps visible. |
| Lint rules | Measurable invariants. |
| `tooling/scripts/evals/` | Before/after fixtures, rubrics, holdouts, with/without-skill runs. |

**Trigger.** Persistent repo instructions tell the coding agent when to load the skill, what it covers, and what it skips. Adapted from Vercel's trigger:

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

Also skip console-only errors and tests with no shipped UI impact. The agent reports which surfaces and references it loaded. Findings cite those sources.

**Modes.** `SKILL.md` resolves the mode before acting, so an audit does not become an edit and a copy pass does not become a redesign. Starting set, from Vercel. Taste equivalents are not named yet.

| Mode | Required behavior |
| --- | --- |
| Shape | Frame the problem, alternatives, flow, states, acceptance criteria, and open decisions. Edit only when asked. |
| Implement | Resolve material product decisions, then make the smallest coherent change in scope. |
| Review | Inspect source and rendered evidence. Report findings. Edit only when asked. |
| Copy | Edit user-facing language and the JSX that language requires. Report structural blockers without widening scope. |
| Harden | Keep the settled direction. Fix state, resilience, responsive behavior, accessibility, and finish. |

When the verb is ambiguous, use the narrowest mode. A URL, screenshot, route, or component sets scope. It does not by itself authorize edits.

**Routing.** Load focused references for the task and the surface. Material changes load product-judgment and interface-quality. Copy, layout, interaction, and resilience each route to their own reference. A modal loads destructive-action patterns. A settings form loads labels, validation, and disclosure. Component APIs, design-system docs, and accessibility criteria stay with their owners. The skill links to them.

**Decision authority.** Adopt Vercel's order. Rung 3 is the target repo's own canonical docs.

1. The user's explicit goal and constraints for this task.
2. Verified user and product evidence, including what shipped.
3. Repository-canonical guidance: `AGENTS.md`, component APIs, the product's design-system docs, routed skills.
4. Accepted decisions and exemplars with stable evidence.
5. Verified adjacent shipped patterns in the same product area.
6. General interface heuristics.

The PRD rule sits on rungs 2 and 5: when a stated preference conflicts with what shipped, shipped wins. The user's goal for the current task still comes first. Shipped code is evidence of what exists. It becomes a standing rule only through the decision record in [First surface](#first-surface).

**Governance.** From Vercel's skill integrity:

- Add or change a rule only after current-source verification and human acceptance.
- Record scope, rationale, evidence, exceptions, and a bad/good example.
- Prefer the narrowest destination: canonical source, routed reference, exemplar, lint or eval check, or coverage gap.
- Keep deterministic checks mechanical. Keep judgment in prose, with its evidence and its degree of freedom.
- Never promote one screenshot, one shipped file, or one reviewer comment into a universal rule by itself.

Stable rule ids point at the canonical source. Vercel's shape:

```
rule/destructive-names-action
Source: copy.md > Actionable; verbs.md
Rule:   Destructive CTAs follow Verb + Noun.
        Never use Confirm, OK, or a bare verb.
```

That rule is their example of an observable decision. Ally's rules come from Sweeper.

## Knowledge layers

[Content Studio](https://www.langchain.com/blog/design-agent) organizes an agent's knowledge into four functions. That is the v0 baseline. [Anthropic's frontend-skills article](https://claude.com/resources/articles/improving-frontend-design-through-skills) is the other half of the baseline: skills are dynamic context, loaded for the task, rather than a permanent system prompt.

| Layer | Role |
| --- | --- |
| Skills | How to do a job. Job-scoped, behind a router. A skill description reads like a routing rule, including when not to use it. |
| Wiki | Shared craft and product facts: brand tokens, voice, patterns, product behavior. Skills link to the wiki. They do not copy it. |
| Gates / linters | Deterministic checks for anything measurable. |
| Memory | Fast: a correction is saved in the same turn. Slow: lessons that hold are promoted into skills and the wiki. |

**Router.** The router skill is mostly one table. Each row maps a kind of ask to the specialist skill that handles it. Content Studio uses this so craft is written once and jobs compose. Taste uses the same shape: one router, then specialist skills. Request modes in [Pack shape](#pack-shape) are how a single entry skill keeps a review from turning into an edit.

**Wiki.** Shared facts live in one place. LangChain: "Rather than duplicating this information across skills, we link directly to the wiki." A font rule changes once. Every skill follows the link.

**Judgment in prompts, invariants in code.** Content Studio: "The order that must always hold lives in code, and the judgment stays in the prompt." They had described a required review order in instructions, and the agent skipped it. The order moved into code. Creative calls stayed in the prompt. Taste uses the same split. A gate can count options, reject a nested modal, or flag a token that is off the product scale. Choosing the right object and consequence for a destructive action stays in prose, with its evidence.

**Memory.** Fast loop: when someone states a rule or a correction, the agent writes it down in the same turn, as a pending decision record in the pack. Slow loop: the Learner later promotes evidence-backed lessons into the skill or the wiki. Content Studio runs that promotion on a weekly pass. The cadence is not locked here. Shared standards take precedence over a personal preference. A company-channel or product rule follows the product voice.

**Rules expire.** Content Studio's [Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html): "Rules designed to compensate for a model's weaknesses become less useful as models improve." After a model upgrade, delete the compensating rules. Keep the design principles. Their early `AGENTS.md` grew to 500K tokens. They cut it to a 200-line index. Taste keeps `AGENTS.md` as a bounded index. The 200-line figure is their practice, not a Taste cap. Growth goes into skills and the wiki.

**Altitude.** Anthropic, on prompting at the right altitude: avoid "low-altitude hardcoded logic like specifying exact hex codes and vague high-altitude guidance that assumes shared context." Aspect skills state why a decision is right and the observable rule an agent can follow. Vague praise is not guidance. A hex value the product did not ship is not guidance. A token the product actually shipped is a wiki fact, and a gate may check it.

## Conformance extraction

Sweeper fills the tree from a shipped product. Learner updates it. Interviewer is for greenfield work and stays off this path while expression is deferred.

Vercel's update loop is the Learner's loop. Cadence is not locked.

1. A collector gathers messages, links, and nearby context. It does not propose rules.
2. A separate judge groups the evidence, verifies sources, and records open questions. Candidates stay pending.
3. A human accepts a candidate into the narrowest destination: agent guidance, a lint rule, an exemplar, an eval, a coverage gap, or no change.

Evidence includes review comments, shipped pull requests, and previews. When evidence is thin, record the code or commit needed to check it. The harness may ask the user for git history here. See [Critic and evals](#critic-and-evals).

**Shipped, flaws, and preferences.** Three different facts:

- A stated preference that conflicts with the shipped product loses. Shipped wins.
- A shipped pattern is recorded as evidence, with rationale if any exists, scope, exceptions, and known flaws. Exemplars document decisions worth repeating and mistakes to avoid.
- Similarity to shipped code is not the success score. Vercel: "Shipped code can contain a flaw that the agent should improve instead of reproduce."

**Design angles.** The PRD list is the search list for Sweeper: style, fonts and typography, themes and tokens, UX, interaction, flow, copy, and more. Map each finding into the narrowest Vercel reference. Add an angle file only when no current reference is the right home. The abstract set that holds across products stays open. HelloAlly's first pain is flow and interaction; that is where the first surface should be looked for, not a mandate to encode every angle before any eval runs.

## Gates and linters

Use a linter when code can identify the failure reliably. Leave the decision in the skill when it needs product context.

Vercel: "Code can count two or three static options, so a linter can recommend radio buttons. Naming the right object and consequence for a destructive action requires product context, so the skill handles it."

Their codebase examples illustrate that split. They are Vercel's rules. Ally's rules come from Sweeper.

- Nested modals, which break focus, keyboard navigation, and layering.
- Radio buttons instead of a select for two or three static options.
- Accessible names for icon buttons and form controls. Custom focus rings that bypass shared focus tokens.
- `className` must not override a design-system component's color, radius, or shadow. Layout classes can stay.
- `Modal.Body`, so long content scrolls and headers and footers can stay sticky.
- Theme-aware Material classes instead of raw shadows. Borders that duplicate a Material's built-in treatment.
- Spacing that falls off the 4px grid, with a standard utility when one exists.

Decision tree, from Vercel:

- Can code identify the failure without rendering?
  - No: agent guidance.
  - Yes: can the rule avoid likely false positives?
    - No: agent guidance.
    - Yes: does the violation have a concrete fix?
      - Yes: a linter.
      - No: a warning, or agent guidance.
- Needs product or codebase context: agent guidance.
- Establishes a new standard or product policy: a human decision.
- Either path gets an example or an eval that can catch a regression.
- If a rule stays reliable only with many exceptions, move it back to agent guidance.

Each lint rule says why the pattern is a problem and suggests a concrete fix. Some may autofix a safe migration. The explanation of why, and any judgment call, stay in the reference prose.

## Critic and evals

**Critic.** A review subagent in the user's harness, on a bigger model, with a crafted brief in the pack. GAN-inspired for now: generator versus critic. It runs in Review mode. It cites the references it loaded. It does not edit unless asked. The exact message protocol, model choice, and number of passes are not locked.

The brief tells the Critic to check the change against the rubric, the exemplars (including known flaws), and the gates. Findings follow Vercel's review shape: lead with user impact, and for each finding include location, verification status, canonical source, user consequence, and the smallest concrete fix. Starting severity labels, from Vercel, until Ally reviews show a better scale:

- **P0:** blocks the primary task, creates severe accessibility failure, or can cause unrecoverable user harm.
- **P1:** likely task failure, misleading consequence, missing critical state, or major responsive/accessibility defect.
- **P2:** meaningful friction, inconsistency, weak hierarchy, or recoverability issue.
- **P3:** minor craft or consistency improvement.

**Rendered check.** Vercel: "Source inspection establishes behavior; a rendered interface establishes visual and interaction quality. Never claim visual verification from code alone." The pack instructs the harness to verify the rendered surface, including materially changed states. [OpenAI's Playwright / computer-use note](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4) is one way a harness can do that. Taste does not ship a browser.

**Eval loop.** Adopt Vercel's guidance evals. Their `copywriting-eval` is a narrower copy check. It is not this loop.

1. Fixtures come from shipped examples documented in the skill. Each fixture has a before state and an after state under `tooling/scripts/evals/`.
2. An agent edits the before state.
3. A judge checks the result against a rubric.
4. Holdouts hide their expected edits, so the test is whether the guidance generalizes.
5. Run the same fixtures without the skill. That is the baseline for whether the pack changed the agent's behavior.
6. Score rule correctness separately from similarity to the shipped result.

Vercel, quoted:

> An agent edits a before state, then a judge checks the results against a rubric.
>
> Evals come from shipped examples documented in the skill. Holdouts hide their expected edits, testing whether the guidance generalizes. We also run fixtures without the skill to measure whether it changed the agent's behavior.
>
> We score rule correctness separately from similarity to the shipped result. Shipped code can contain a flaw that the agent should improve instead of reproduce.

Test retrieval and application separately. Failing to load the skill and failing to follow a rule are different problems. The repo `AGENTS.md` trigger is its own test.

**Data the eval may need.** A fixture sometimes cannot be built from the working tree alone. The coding agent, in the user's harness, may ask the user for access to production data and git history. That request stays in the harness, with the user approving it.

The PRD success signal still holds: a mergeable first pass, no long design prompt, no re-teaching per screen. Gate pass rate and a with/without-pack comparison on past Ally UI changes are one optional path, not the only one. What proves a mergeable first pass without hand-labelling is still an open product question.

## First surface

Vercel, on where to start:

> The hardest part is picking the first surface. Every team has decisions worth encoding. The question is whether they live in someone's head or somewhere agents can find them.

Taste's job is to nudge the coding agent to document that surface properly. Sweeper, Learner, and the coding agent under the skill follow the same discipline.

Start with one product surface where the same review comments already repeat. On Ally, look first at flow and interaction. Collect shipped examples and real reviews. Write the decision, why it matters, the exceptions, and the source. Expand surface by surface. Keep `coverage-gaps.md` current so missing guidance stays visible.

Observable decisions, not adjectives. Vercel:

> Avoid starting with broad adjectives like `clear`, `polished`, or `intuitive`. Agents need observable decisions. `Destructive actions use Verb + Noun` is usable. `Buttons should be clear` is not.

**Decision template.** Fill this in before widening to the next surface. Status stays `proposed` until a human accepts it. Fields are Vercel's decision record.

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

The skill's operating contract includes the nudge: when the same decision shows up and the pack does not contain it, the agent writes this record into the narrowest file and leaves it pending. It does not silently invent a universal rule.

## Anti-slop and aspect skills

Generic UI is the default when the pack is silent. Both Anthropic and OpenAI describe that failure, and the pack says so explicitly.

Anthropic, on an unguided landing page: models "almost always conform to Inter fonts, purple gradients on white backgrounds, and minimal animations." They name the cause [distributional convergence](https://en.wikipedia.org/wiki/Convergence_of_random_variables): sampling sits on the high-probability center of the training data. Their axes for steering are typography, color and theme, motion, and backgrounds. They also warn that a ban list can create a new local maximum (their example is Space Grotesk). Name the product's own alternatives. Do not swap one generic default for another.

OpenAI, on underspecified prompts: "models often fall back to high-frequency patterns from the training data." Their hard rules are useful **expression** priors: one composition in the first viewport, a hero budget, cardless by default, brand-first, expressive type, atmosphere instead of a flat field. The portable pack pattern is their [`frontend-skill`](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill). Those priors are subordinate to conformance once a product pack exists. OpenAI's own exception:

> Exception: If working within an existing website or design system, preserve the established patterns, structure, and visual language.

If the product shipped Inter, or a purple brand, conformance keeps it. Anti-slop rejects a default the product did not choose. Shipped wins.

**Aspect skills.** [Emil Kowalski](https://emilkowal.ski/ui/agents-with-taste): "My way of getting there is to create a skill file for each aspect of the interface. If you know what great feels like, describe the rules, then give them to your agents so they can follow them." Each file says why the choice feels right, then a strict table or flowchart so the agent does not invent a rule. His easing example: "This is strict so the agent doesn't have to guess or make up its own rules." He uses Anthropic's [skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) to package that.

Compose aspect skills under the router. The router is job-scoped (shape, implement, review, copy, harden, and later the product's real jobs). The aspect file is the specialist reference for one angle: animation, typography, color, and the rest of the open set. Why and rules live there. Measurable slices of those rules graduate into gates. Expression-only aspect guidance (distinctive type, anti-slop bans, hero budget) waits for greenfield or an unlocked design.

Anthropic's other point is the conformance reading: a custom skill can encode the organization's design system and component patterns as a reusable asset, loaded on demand. That is the product pack. The generic frontend-aesthetics skill is not a substitute for it.

## Dogfood

| Track | Surface | What runs |
| --- | --- | --- |
| Now | HelloAlly ally-platform | Conformance. First pain: flow and interaction. Sweeper extracts into the pack shape above. Critic and evals run against that pack. |
| Later | omnipresent | Expression. Interviewer. Expression priors from the anti-slop section. |

Ally is the dogfood surface only. Product thinking stays harness-agnostic and product-agnostic. The lifecycle switch (expression closed, design locked, Taste returns to conformance) has no trigger yet. See the [PRD](prd.md).

Discovery is dual-track. Sweep followed by historical replay is one path. It is not locked as the only path.

## Open engineering questions

Not locked, on purpose:

- The final abstract set of design angles.
- The MCP tool surface.
- The Critic protocol beyond the GAN-inspired placeholder (model, passes, message shape).
- The trigger that shows expression is closed and the design is locked, so Taste switches to conformance.
- Whether Sweep to historical replay is the only discovery path.
- Whether further engineering sources should still change this architecture before it is locked. This draft adds Vercel, OpenAI, and Emil on top of the LangChain and Anthropic baseline. The set is not closed.
- How a sweep tells a deliberate pattern from an accidental or legacy one.
- What eval proves a mergeable first pass without hand-labelling.
- Which conformance lessons carry over when expression starts on omnipresent.
- The memory file layout and the slow-loop cadence. The fast and slow loops are in scope. The storage format is not.
- The 200-line `AGENTS.md` cap. Bound the index. Do not treat LangChain's number as the limit.

## Bibliography

What this architecture takes from each source. Quotes in the sections above are from these texts.

### LangChain — Content Studio

- Article: [Building a design agent](https://www.langchain.com/blog/design-agent)
- Open source: [langchain-ai/design-agent](https://github.com/langchain-ai/design-agent)
- Took: job-scoped skills behind a router; a wiki that skills link to; gates in code for measurable checks; fast memory in the same turn and slow promotion into skills and the wiki; judgment in prompts and invariants in code; anti-default guidance; rules expire after model upgrades ([Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)); `AGENTS.md` as a bounded index. The harness owns the loop. Taste does not adopt Content Studio's media computer or Slack product.

### Anthropic — frontend skills

- Article: [Improving frontend design through Skills](https://claude.com/resources/articles/improving-frontend-design-through-skills)
- Took: distributional convergence as the reason unguided UI looks generic; skills as on-demand context; prompt altitude between hardcoded values and vague praise; axes of typography, color and theme, motion, and backgrounds; custom skills as the way an organization encodes its own design system.

### Vercel — product-design

- Article: [Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel)
- Took: the pack structure this doc recommends; skill plus linters plus a human review loop; request modes; references, exemplars, and coverage gaps; linters for deterministic rules and prose for judgment; evals (before state, judge, rubric, shipped exemplars, holdouts, with/without-skill baseline, correctness scored separately from similarity); the first-surface quote and the decision template; evidence intake through collector, judge, and human acceptance into the narrowest destination.

### OpenAI — delightful frontends

- Article: [Designing delightful frontends with GPT-5.4](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4)
- Pack pattern: [`frontend-skill`](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill)
- Took: underspecified prompts fall back to high-frequency patterns; hard rules for composition (hero budget, cardless default, brand-first, expressive type, atmosphere) as expression priors; the exception that an existing design system wins; visual references and early tokens; rendered verification with Playwright or computer use.

### Emil Kowalski — agents with taste

- Article: [Agents with Taste](https://emilkowal.ski/ui/agents-with-taste)
- Took: one skill file per interface aspect; articulate why a decision feels right; strict tables and flowcharts the agent can follow; package that experience so the agent stops guessing. Aspect skills sit under the router.

### Product

- [docs/prd.md](prd.md), mirroring [Taste: One-Pager](https://docs.google.com/document/d/1_Gynsn9Q_s66jlS0YJNDlGG2jxNq-XPfvuhUenPU35U/edit) (Gopi · Draft · Oct 2026).
