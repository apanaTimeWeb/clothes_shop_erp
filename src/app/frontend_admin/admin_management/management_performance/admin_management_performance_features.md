---
module: management_performance
version: 1.1.0
status: implemented
---

# Offer period comparison and exact recorded use

## 1. Purpose

Offer period comparison and exact recorded use

## 2. Scope

Keep the before/during product-sales comparison and add grouped actual offer-use records with receipt count, units, returns, granted line discount and retained-unit discount.

## 3. Ownership

This capability owns its data contracts, state, validation, messages and UI. Business code is not imported from sibling modules.

## 4. Route

/frontend_admin/admin_management/management_performance

## 5. Entry points

page.tsx, layout.tsx and error.tsx; parent navigation links this page.

## 6. Modes

Staff/Admin preview only. Preview modes are UI controls, not secure authorization.

## 7. Inputs

Explicit Apply current product offers snapshots the offer ID/name/product/quantity/discount against draft lines. Manual saves clear attribution until offers are applied again. Completion freezes matching records. Higher manual discounts are not attributed.

## 8. Outputs

Keep the before/during product-sales comparison and add grouped actual offer-use records with receipt count, units, returns, granted line discount and retained-unit discount.

## 9. Data model

Main shop schema version 1 plus operations document version 1 with backward-compatible optional/defaulted additions.

## 10. State

Owner-local validated state with opaque document subscriptions. External files are parsed as data.

## 11. Persistence

clothes-shop.demo.next.v1 and clothes-shop.operations.v1. Complete backup also includes offers and Studio. Reminder timestamp is optional local metadata.

## 12. Validation

Explicit Apply current product offers snapshots the offer ID/name/product/quantity/discount against draft lines. Manual saves clear attribution until offers are applied again. Completion freezes matching records. Higher manual discounts are not attributed.

## 13. Transactions

Read current state, validate and compare expected raw snapshots before saving. Use one editing tab. Ordinary storage errors attempt rollback.

## 14. Workflow

Keep the before/during product-sales comparison and add grouped actual offer-use records with receipt count, units, returns, granted line discount and retained-unit discount.

## 15. Integration

Generic transport passes document strings; each owner duplicates the required business contracts.

## 16. Money and units

Integer paise and whole quantities. Display currency INR. Existing receipt prices are never recomputed from current catalogue prices.

## 17. Reporting semantics

Explicit Apply current product offers snapshots the offer ID/name/product/quantity/discount against draft lines. Manual saves clear attribution until offers are applied again. Completion freezes matching records. Higher manual discounts are not attributed.

## 18. Errors

Show invalid input or storage errors. Failed validation does not save partial data. Complete restore is available for mismatched documents.

## 19. Accessibility and theme

Co-located English messages, semantic theme tokens, native labelled controls and scrollable wide tables. Browser/mobile/physical print verification is not certified.

## 20. Verification

Release checks record TypeScript, lint, architecture, isolated source compilation and production build. No unit/component/E2E tests added or executed.

## 21. Limitations

Only sales completed with new recorded attribution are counted as exact usage. Earlier sales are not backfilled or guessed. Offer deletion does not delete snapshots. This is not causal uplift or profit attribution.

## 22. Maintenance

Keep capability file/line ceilings and absolute owner imports. See FINAL_PROJECT_DELIVERY.md and docs/RETAIL_WORKFLOWS_1_1.md for current behavior.
