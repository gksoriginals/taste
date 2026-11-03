---
name: taste-setup
description: Explicitly inspect this repository and create, resume, or refresh its product Taste Pack.
---

# Set up Taste for this repository

Run the explicit `taste-setup` Skill for the repository currently open. This command is the user's authorization to inspect the repository and write the product's `taste/` Pack. It does not authorize product UI changes.

- Inspect repository instructions, manifests, app structure, routes/navigation, UI source, docs, design systems, existing Pack, and links/config for Figma or other product design sources before choosing scope. Use connected design integrations when available; Figma is optional and does not block a viable rendered UI sweep.
- Inventory likely products, apps, entry points, routes, and navigation. Group routes into user journeys and important states. Choose a bounded representative scope without requiring a manual tour of every route. Ask which product/app to configure first only when multiple plausible choices materially change Pack scope.
- Check public/demo routes and safe local seed/test access before asking about auth. Use non-sensitive seeded data only. If auth blocks important coverage, ask once for access or a safe local path; prefer configured secret handling or user-operated local login over credentials pasted into chat. Never request production credentials or store credentials, tokens, or real personal data.
- Use browser automation or host UI tools for representative rendered checkpoints and a broader route pass. Correlate screenshots/accessibility snapshots with routes, components, tokens, state/validation logic, docs, and any design reference. Label evidence type and report sample limits; source review is not rendered inspection.
- With no existing Pack, do not initialize if no product UI exists or none of the chosen UI can be rendered. If some UI can be inspected but important auth coverage is blocked, create only evidence-backed guidance and leave the Pack incomplete. For a new product/surface task, continue in Expression and run Setup after UI exists.
- For an existing Pack, inspect it before changes, preserve useful content, then mark it incomplete before the refresh sweep or first write. Incomplete access, interruption, or validation failure keeps the Pack incomplete; preserve files and resume from them.
- Keep the Pack canonical and versioned. If configured host memory is useful, store only operational notes with provenance and last-verified date. Verify stale notes before use. Never store secrets or personal data in Pack or memory.
- Write only useful product-specific guidance justified by inspected evidence. Self-review and report uncovered journeys/states. When the chosen scope was sufficiently rendered and guidance self-checks cleanly, tentatively set complete and validate; restore incomplete if validation fails. If auth blocks important coverage, leave incomplete.
- If interrupted, preserve files, leave setup status incomplete where a Pack exists, explain uninspected coverage, and provide `/taste-setup` as the resume path.
