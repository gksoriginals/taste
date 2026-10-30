---
name: taste-pack
description: Use when discovering product design decisions from shipped work, initializing a product's Taste Pack, or reviewing and updating product-specific Taste guidance.
---

# Build and maintain a product Pack

The existing harness coding agent performs the analysis. Use Taste tools for Pack inspection, file operations, and structural validation; use judgment to interpret product evidence.

## Discover guidance

1. Choose a first product surface where repeated decisions or review corrections are visible. Use the user's product direction to bound the surface.
2. Ask the harness to obtain access to Git history, reviews, design files, or production data when that evidence is needed. Do not assume access or invent evidence.
3. Collect links and examples before drafting rules. Separate observed product facts, inferred decisions, known flaws, counterexamples, and evidence gaps.
4. Ask: “What repeated decision is currently in someone's head that an agent needs to find?” Capture the reasoning, scope, exceptions, and examples with each candidate.
5. Place accepted product knowledge in shared, Conformance, or Expression references according to its meaning. Keep examples and known flaws beside related guidance. Keep transient/private corrections in harness or plugin working memory until reviewed.

## Initialize or update

- Initialize only when the user asks or agrees. `taste_pack_initialize` creates a starter under the target repository's `taste/` directory, fails if that directory already exists, and does not edit the repository's `AGENTS.md` or harness configuration.
- Inspect and validate the Pack before and after edits. Use `taste_pack_write` or the harness's repository editor to create/update files only within `taste/`. Keep the entry Skill focused on mode selection and routing; put product decisions in linked references.
- Do not promote a candidate to accepted product guidance or add a Gate without product-owner review. Put deterministic checks only around rules with explicit, reliable outcomes; keep product judgment in Skills and human review.
- Preserve uncertainty. Do not infer a universal rule from a single screenshot, component, or comment.

For evaluation fixtures and with/without-Skill comparisons, use `taste-evaluate`.
