---
module: management_barcodes
version: 1.0.0
status: implemented
---

# Barcode scanner and labels

## 1. Purpose

Barcode scanner and labels for the single-browser clothing shop demo.

## 2. Scope

Exact SKU lookup from manual entry or a keyboard scanner, optional native camera scanning, billing SKU handoff, SVG Code 39 label download and print batches.

## 3. Ownership

This capability owns its schemas, types, fixture, state, messages and UI. No sibling business imports.

## 4. Route

/frontend_admin/admin_management/management_barcodes

## 5. Entry points

page.tsx, layout.tsx and error.tsx. Parent navigation links this route.

## 6. Modes

Staff/Admin preview; customer mode displays a staff-only message. Preview modes are not secure authentication.

## 7. Inputs

Existing catalogue SKU; standard uppercase Code 39 alphabet, 1–24 characters; maximum 200 labels per batch.

## 8. Outputs

Exact SKU lookup from manual entry or a keyboard scanner, optional native camera scanning, billing SKU handoff, SVG Code 39 label download and print batches.

## 9. Data model

Existing catalogue SKU; standard uppercase Code 39 alphabet, 1–24 characters; maximum 200 labels per batch.

## 10. State

Owner-local React state, validated document reads and opaque transport subscriptions.

## 11. Persistence

Main shop: clothes-shop.demo.next.v1. Operations: clothes-shop.operations.v1. Complete backup also includes clothes-shop.style-studio.v1 and clothes-shop.offers.v1.

## 12. Validation

Zod validates stored and incoming records. Main snapshot integrity and related SKU/location/receipt references are checked before saves.

## 13. Transactions

Mutations read current snapshots, validate, and compare expected raw values before grouped writes. Rollback is attempted for ordinary storage failures. Use one active tab.

## 14. Workflow

Exact SKU lookup from manual entry or a keyboard scanner, optional native camera scanning, billing SKU handoff, SVG Code 39 label download and print batches.

## 15. Integration

Uses persisted document contracts through generic transport; business logic stays inside this capability.

## 16. Money and quantities

Money is integer paise; displayed currency is INR. Quantities are integers. Historical receipts are not repriced.

## 17. Reporting semantics

No automatic EAN mapping. Camera requires compatible native BarcodeDetector and secure context. Camera frames remain local. Verify printed labels with actual hardware; camera and printer were not hardware-tested.

## 18. Errors

Invalid storage fails closed for editing; restore a matching complete backup. Browser storage quota errors are surfaced.

## 19. Accessibility and theme

Semantic theme tokens, labelled native controls, responsive grids and scrollable wide tables. English messages are co-located. Hands-on device/a11y verification remains outstanding.

## 20. Verification

TypeScript, ESLint, WET architecture, isolated capability compilation and production build are recorded in final delivery checks. No unit/component/E2E tests added or run.

## 21. Limitations

No automatic EAN mapping. Camera requires compatible native BarcodeDetector and secure context. Camera frames remain local. Verify printed labels with actual hardware; camera and printer were not hardware-tested. No backend, cloud synchronization or secure multi-user authorization.

## 22. Maintenance

Retain 25-file/module and source line ceilings. Generic host UI and document transport are declared in contracts/host-stubs.d.ts. See FINAL_PROJECT_DELIVERY.md.
