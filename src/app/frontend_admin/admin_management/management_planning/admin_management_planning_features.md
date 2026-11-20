---
module: management_planning
version: 1.0.0
status: implemented
---

# Stock ageing and reorder

## 1. Purpose

Stock ageing and reorder for the single-browser clothing shop demo.

## 2. Scope

Searchable SKU-level stock-age buckets, trailing sales, incoming orders, editable lead days and safety stock, suggested reorder quantities and CSV export.

## 3. Ownership

This capability owns its schemas, types, fixture, state, messages and UI. No sibling business imports.

## 4. Route

/frontend_admin/admin_management/management_planning

## 5. Entry points

page.tsx, layout.tsx and error.tsx. Parent navigation links this route.

## 6. Modes

Staff/Admin preview; customer mode displays a staff-only message. Preview modes are not secure authentication.

## 7. Inputs

Target = ceil(gross units sold / selected days × lead days) + safety; reorder = max(0, target − sellable − open purchase quantity).

## 8. Outputs

Searchable SKU-level stock-age buckets, trailing sales, incoming orders, editable lead days and safety stock, suggested reorder quantities and CSV export.

## 9. Data model

Target = ceil(gross units sold / selected days × lead days) + safety; reorder = max(0, target − sellable − open purchase quantity).

## 10. State

Owner-local React state, validated document reads and opaque transport subscriptions.

## 11. Persistence

Main shop: clothes-shop.demo.next.v1. Operations: clothes-shop.operations.v1. Complete backup also includes clothes-shop.style-studio.v1 and clothes-shop.offers.v1.

## 12. Validation

Zod validates stored and incoming records. Main snapshot integrity and related SKU/location/receipt references are checked before saves.

## 13. Transactions

Mutations read current snapshots, validate, and compare expected raw values before grouped writes. Rollback is attempted for ordinary storage failures. Use one active tab.

## 14. Workflow

Searchable SKU-level stock-age buckets, trailing sales, incoming orders, editable lead days and safety stock, suggested reorder quantities and CSV export.

## 15. Integration

Uses persisted document contracts through generic transport; business logic stays inside this capability.

## 16. Money and quantities

Money is integer paise; displayed currency is INR. Quantities are integers. Historical receipts are not repriced.

## 17. Reporting semantics

FIFO age reconstruction is an estimate, not batch tracking. Opening stock and undated adjustments are unknown age. Physical on-hand includes damaged units; reorder uses sellable stock. Returns are not subtracted from demand. No orders are placed automatically.

## 18. Errors

Invalid storage fails closed for editing; restore a matching complete backup. Browser storage quota errors are surfaced.

## 19. Accessibility and theme

Semantic theme tokens, labelled native controls, responsive grids and scrollable wide tables. English messages are co-located. Hands-on device/a11y verification remains outstanding.

## 20. Verification

TypeScript, ESLint, WET architecture, isolated capability compilation and production build are recorded in final delivery checks. No unit/component/E2E tests added or run.

## 21. Limitations

FIFO age reconstruction is an estimate, not batch tracking. Opening stock and undated adjustments are unknown age. Physical on-hand includes damaged units; reorder uses sellable stock. Returns are not subtracted from demand. No orders are placed automatically. No backend, cloud synchronization or secure multi-user authorization.

## 22. Maintenance

Retain 25-file/module and source line ceilings. Generic host UI and document transport are declared in contracts/host-stubs.d.ts. See FINAL_PROJECT_DELIVERY.md.
