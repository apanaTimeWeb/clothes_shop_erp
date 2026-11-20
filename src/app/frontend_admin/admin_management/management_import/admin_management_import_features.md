---
module: management_import
version: 1.1.0
status: implemented
---

# Bulk CSV catalogue and opening stock import

## 1. Purpose

Bulk CSV catalogue and opening stock import

## 2. Scope

Download an 18-column CSV template, inspect accepted vocabulary/location IDs, upload up to 2 MB and 1000 rows, validate every row, review the table and confirm an all-or-nothing import.

## 3. Ownership

This capability owns its data contracts, state, validation, messages and UI. Business code is not imported from sibling modules.

## 4. Route

/frontend_admin/admin_management/management_import

## 5. Entry points

page.tsx, layout.tsx and error.tsx; parent navigation links this page.

## 6. Modes

Staff/Admin preview only. Preview modes are UI controls, not secure authorization.

## 7. Inputs

Each row creates a new SKU and opening balance. Existing SKUs and duplicate design/colour/size variants are rejected. Repeated design codes require identical attributes/prices. Departments/categories/locations must already exist. Prices are INR with at most two decimals; quantities are nonnegative whole units. A changed snapshot requires a fresh preview.

## 8. Outputs

Download an 18-column CSV template, inspect accepted vocabulary/location IDs, upload up to 2 MB and 1000 rows, validate every row, review the table and confirm an all-or-nothing import.

## 9. Data model

Main shop schema version 1 plus operations document version 1 with backward-compatible optional/defaulted additions.

## 10. State

Owner-local validated state with opaque document subscriptions. External files are parsed as data.

## 11. Persistence

clothes-shop.demo.next.v1 and clothes-shop.operations.v1. Complete backup also includes offers and Studio. Reminder timestamp is optional local metadata.

## 12. Validation

Each row creates a new SKU and opening balance. Existing SKUs and duplicate design/colour/size variants are rejected. Repeated design codes require identical attributes/prices. Departments/categories/locations must already exist. Prices are INR with at most two decimals; quantities are nonnegative whole units. A changed snapshot requires a fresh preview.

## 13. Transactions

Read current state, validate and compare expected raw snapshots before saving. Use one editing tab. Ordinary storage errors attempt rollback.

## 14. Workflow

Download an 18-column CSV template, inspect accepted vocabulary/location IDs, upload up to 2 MB and 1000 rows, validate every row, review the table and confirm an all-or-nothing import.

## 15. Integration

Generic transport passes document strings; each owner duplicates the required business contracts.

## 16. Money and units

Integer paise and whole quantities. Display currency INR. Existing receipt prices are never recomputed from current catalogue prices.

## 17. Reporting semantics

Each row creates a new SKU and opening balance. Existing SKUs and duplicate design/colour/size variants are rejected. Repeated design codes require identical attributes/prices. Departments/categories/locations must already exist. Prices are INR with at most two decimals; quantities are nonnegative whole units. A changed snapshot requires a fresh preview.

## 18. Errors

Show invalid input or storage errors. Failed validation does not save partial data. Complete restore is available for mismatched documents.

## 19. Accessibility and theme

Co-located English messages, semantic theme tokens, native labelled controls and scrollable wide tables. Browser/mobile/physical print verification is not certified.

## 20. Verification

Release checks record TypeScript, lint, architecture, isolated source compilation and production build. No unit/component/E2E tests added or executed.

## 21. Limitations

No overwrite, stock restocking, image import or XLSX parsing. Save spreadsheet files as CSV with the exact template headers. Opening-stock age is unknown; import time is not claimed as receipt date.

## 22. Maintenance

Keep capability file/line ceilings and absolute owner imports. See FINAL_PROJECT_DELIVERY.md and docs/RETAIL_WORKFLOWS_1_1.md for current behavior.
