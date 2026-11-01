---
id: landing-page-clear-workflow
title: Keep the landing page focused
status: accepted
trigger: gap
scope: landing-page
coverage_gap: false
shipped: false
validated_artifact: site/index.html (SHA-256 fa6324bd30b8593b29d23eeb480d036716aea06702a9e32989c502f950b8dc1d)
user_approved_artifact: site/index.html (SHA-256 fa6324bd30b8593b29d23eeb480d036716aea06702a9e32989c502f950b8dc1d)
---

# Keep the landing page focused

## Statement

Keep Taste's landing page focused on one clear workflow, with plain language and no repeated explanation.

## Rationale

The page should explain Taste through one direct workflow and distinguish transient task work from durable product decisions without repeating the same approval rule.

## Shipped evidence

- none

## Validation evidence

- Host reported npm test passed (23/23).
- Host reported TypeScript typecheck passed.
- Host reported package validation passed.
- Host reported git diff --check passed.
- Host inspected Chromium at desktop 1280×1000 and mobile 390×844; neither viewport had horizontal overflow.
- Host exercised both workflow states; the review state displayed the proposed Decision while taste/ remained unchanged.

## User approval evidence

The owner explicitly approved both the tested landing-page artifact and this exact Decision by selecting “Approve both; record it”.

## Coverage gap

None recorded.

## Known flaws

_None recorded._

## Alternatives

_None recorded._
