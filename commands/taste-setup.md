---
name: taste-setup
description: Explicitly inspect this repository and create, resume, or refresh its product Taste Pack.
---

# Set up Taste for this repository

Run the explicit `taste-setup` Skill for the repository currently open. This command is the user's authorization to inspect the repository and write the product's `taste/` Pack. It does not authorize product UI changes.

- Inspect repository root, local instructions, app/product manifests, UI surfaces, design systems, and existing Taste files before choosing scope or writing anything. On first-time setup, finish the rendered UI sweep before creating `taste/`.
- If no product UI exists, do not create a Pack. If the requested task is to design a new product or surface, continue that task in Expression and run Setup after the UI exists.
- If first-time UI inspection is inaccessible, stop before initialization, report the access gap, and explain that `/taste-setup` can be rerun when access is available.
- If no user-facing product UI exists, report that no Pack is needed. Continue without asking when repository evidence shows one obvious product and scope. For a single product with multiple surfaces, choose a central workflow from navigation and docs. Ask which product/app to configure first only when multiple materially different choices remain unclear.
- Inspect a bounded, agreed scope. Use one Pack for apps that share product identity and design foundations; use separate Packs only for genuinely independent products/repositories.
- If a Pack exists and is marked incomplete, resume from its current contents. Never initialize over it or discard completed work. Before refreshing a complete Pack, mark it incomplete until the refresh has been written, checked, and validated.
- For an existing Pack, inspect it first; identify stale, missing, conflicting, or unsupported guidance and preserve useful content. A partial or source-only refresh stays incomplete and its coverage gaps are reported.
- Write only useful, product-specific guidance supported by inspected evidence. Self-check and validate; set setup status complete only when finished.
- If interrupted, leave setup status incomplete and provide the resume command `/taste-setup`.
