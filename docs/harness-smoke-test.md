# Harness smoke test

Use this procedure after installing Taste in a host. Run it in a disposable product repository if you do not want to touch a real project. These steps verify tool/Skill routing and Pack writes; they do not certify visual quality.

## Normal UI work and explicit setup

1. Use a disposable product repository without `taste/`. Ask for a routine UI review/change. Confirm the host continues from repository evidence, does not create or write `taste/`, does not launch a sweep, and offers `/taste-setup` separately.
2. Invoke `/taste-setup` (or the `taste-setup` Skill in a host without slash commands). Confirm it inspects local instructions, repo/app manifests, product identity, UI surfaces, design systems, and existing Taste files before asking questions or choosing scope.
3. For one obvious app/surface, confirm the host states its bounded default and proceeds. For a multi-app repo where scope is unclear, confirm it asks which app/product to configure first instead of sweeping everything.
4. If the full agreed scope is accessible, confirm the host inspects representative rendered UI and source, records evidence, creates useful product-specific guidance, self-checks it, marks `setupStatus: complete`, and calls `taste_pack_validate`. If any part is inaccessible or inspection is source-only, confirm it reports the gap and leaves setup incomplete. Confirm setup changed no product UI.
5. After the rendered sweep, interrupt setup after initialization or after one guidance file is written. Confirm `setupStatus` remains `incomplete`, files are preserved, validation does not call it complete, and `/taste-setup` resumes without calling initialize over the existing Pack.
6. In a repository with no user-facing UI, invoke setup and confirm it creates no `taste/` directory. If first-time rendered UI is inaccessible, confirm it stops before initialization and reports the access gap.
7. In an existing Pack, invoke refresh and confirm it reviews current guidance first, preserves supported content, and updates only evidence-backed items. If some surfaces cannot be inspected, confirm it reports them and does not mark the refresh complete.
8. For a requested new surface in a repository with no Pack, confirm the host proceeds in Expression without running Setup. A later explicit Setup may sweep that UI once it exists.

## Learning in a normal task

1. Start with an existing complete Pack and ask the host to make a design choice on a covered surface.
2. Reject the choice or state a different preference. Confirm the host adapts and self-checks the requested UI.
3. If the feedback yields a reusable lesson, confirm the host updates the existing relevant checklist in the same task, without a separate approval step or setup sweep.
4. Repeat with a repository that has no Pack. Confirm feedback stays task-local and no Pack is created; the host offers explicit `/taste-setup` separately.

## Diagnostics

To enable detailed server diagnostics, set `TASTE_LOG_LEVEL=debug` in the Taste MCP server environment for the host under test. Check the host’s MCP/server logs for startup, tool names, duration, and stable error codes. Diagnostic output uses stderr and excludes tool arguments, Pack contents, conversation text, and repository paths.

## Record the result

For each host, record its version, install path, whether the Taste Skills appeared, whether the MCP server started, whether both flows routed correctly, and whether the expected Pack files changed. Write that in [harness-smoke-results.md](harness-smoke-results.md). Leave every cell `unverified` until you have run the steps directly in that host. Do not copy the expected behavior into the sheet as if it were a result.
