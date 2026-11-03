# Harness smoke test

Use this procedure after installing Taste in a host. Run it in a disposable product repository if you do not want to touch a real project. These steps verify tool/Skill routing and Pack writes; they do not certify visual quality.

## Normal UI work and explicit setup

1. Use a disposable product repository without `taste/`. Ask for a routine UI review/change. Confirm the host continues from repository evidence, does not create or write `taste/`, does not launch a sweep, and offers `/taste-setup` separately.
2. Invoke `/taste-setup` (or the `taste-setup` Skill in a host without slash commands). Confirm it inspects local instructions, repo/app manifests, routes/navigation, product identity, UI surfaces, design systems, existing Taste files, and links/config for likely design sources before asking questions or choosing scope. Figma should be treated as optional.
3. For one obvious app/surface, confirm the host states its bounded default and proceeds. For a multi-app repo where scope is unclear, confirm it asks which app/product to configure first instead of sweeping everything.
4. If the chosen scope is sufficiently accessible, confirm the host inspects representative rendered UI and source, records evidence, creates useful product-specific guidance, self-checks it, tentatively marks `setupStatus: complete`, and validates. Confirm source-only evidence can produce `usable_partial` guidance under the default policy when specific and cited, with visual behavior labeled unverified. If the configured policy is `rendered_flow`, source-only evidence remains `in_progress`. Confirm setup changed no product UI.
5. After the rendered sweep, interrupt setup after initialization or after one guidance file is written. Confirm status remains `in_progress` or `usable_partial` according to the evidence already collected, files are preserved, validation does not call it complete, and `/taste-setup` resumes without calling initialize over the existing Pack.
6. In a repository with no user-facing UI, invoke setup and confirm it creates no `taste/` directory. If no product UI or UI source exists, confirm it stops before initialization. If some surfaces are source-only or blocked, confirm it creates only supported guidance, marks visual gaps, and continues other in-scope apps.
7. In an existing Pack, invoke refresh and confirm it reviews current guidance first, preserves supported content, preserves the most accurate status during the sweep, and updates only evidence-backed items. If important surfaces cannot be inspected, confirm it reports them and leaves the refresh incomplete.
8. For a requested new surface in a repository with no Pack, confirm the host proceeds in Expression without running Setup. A later explicit Setup may sweep that UI once it exists.
9. In an auth-gated product, confirm it checks public/demo/seed access first, uses only safe local seeded data, asks once for safe auth access when important coverage is blocked, and never requests production credentials. If access is unavailable, confirm it continues on accessible surfaces, distinguishes rendered evidence from source facts/inferences, records authenticated coverage incomplete, and gives a resume path.
10. In a many-route product, confirm it groups routes into journeys, samples representative flows/states, and does a broad pass for uncovered areas without requiring every route to be inspected deeply. Confirm the report explains what the sample does not cover.
11. Where repo docs/config point to Figma or another design source, confirm the host checks available integrations and uses accessible design evidence alongside rendered product behavior. If access is missing, confirm it asks only when that source would materially improve scope and continues without optional Figma when UI inspection is sufficient.
12. If host memory is configured, confirm only operational notes are retained with provenance and a last-checked date, are reverified before reuse, and contain no secrets or user data. Confirm the Pack remains the canonical product guidance.

## Learning in a normal task

1. Start with an existing complete Pack and ask the host to make a design choice on a covered surface.
2. Reject the choice or state a different preference. Confirm the host adapts and self-checks the requested UI.
3. If the feedback yields a reusable lesson, confirm the host updates the existing relevant checklist in the same task, without a separate approval step or setup sweep.
4. Repeat with a repository that has no Pack. Confirm feedback stays task-local and no Pack is created; the host offers explicit `/taste-setup` separately.

## Diagnostics

To enable detailed server diagnostics, set `TASTE_LOG_LEVEL=debug` in the Taste MCP server environment for the host under test. Check the host’s MCP/server logs for startup, tool names, duration, and stable error codes. Diagnostic output uses stderr and excludes tool arguments, Pack contents, conversation text, and repository paths.

## Record the result

For each host, record its version, install path, whether the Taste Skills appeared, whether the MCP server started, whether both flows routed correctly, and whether the expected Pack files changed. Write that in [harness-smoke-results.md](harness-smoke-results.md). Leave every cell `unverified` until you have run the steps directly in that host. Do not copy the expected behavior into the sheet as if it were a result.
