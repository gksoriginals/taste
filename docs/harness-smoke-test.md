# Harness smoke test

Use this procedure after installing Taste in a host. Run it in a disposable product repository if you do not want to touch a real project. These steps verify tool/Skill routing and Pack writes; they do not certify visual quality.

## Existing product bootstrap

1. Use a product repository with several user-facing routes and no `taste/` directory. Ask the host to set up Taste from the existing UI.
2. Confirm the host inventories the full surface map and inspects reachable rendered flows/states. If it uses parallel tasks, confirm each worker has a bounded surface and the host reconciles their evidence.
3. Inspect `taste/manifest.json`, `skills/product-design/SKILL.md`, task/surface references, checklists, and source/coverage metadata. Confirm the Skill routes by request mode and surface and links to canonical sources.
4. Confirm the host performed its own coverage/evidence self-check, created the Pack without asking for human approval, and called `taste_pack_validate`.

## Conversation learning

1. Ask the host to make a design choice on an existing surface.
2. Reject the choice or state a different preference in the conversation. Confirm the host adapts the UI without asking for a separate Pack or Decision approval.
3. Confirm the host self-checks the change and writes a scoped checklist item with the check, rationale, scope, and source reference.
4. Give a correction to the checklist item. Confirm the host updates the relevant item in the same conversation and does not require a review/promotion checkpoint.

## Diagnostics

To enable detailed server diagnostics, set `TASTE_LOG_LEVEL=debug` in the Taste MCP server environment for the host under test. Check the host’s MCP/server logs for startup, tool names, duration, and stable error codes. Diagnostic output uses stderr and excludes tool arguments, Pack contents, conversation text, and repository paths.

## Record the result

For each host, record its version, install path, whether the Taste Skills appeared, whether the MCP server started, whether both flows routed correctly, and whether the expected Pack files changed. Write that in [harness-smoke-results.md](harness-smoke-results.md). Leave every cell `unverified` until you have run the steps directly in that host. Do not copy the expected behavior into the sheet as if it were a result.
