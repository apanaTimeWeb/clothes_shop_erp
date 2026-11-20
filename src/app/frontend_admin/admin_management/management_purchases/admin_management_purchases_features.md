---
module: management_purchases
version: 1.1.0
status: implemented
---

# Suppliers, partial purchases and payments

## 1. Purpose

Suppliers, partial purchases and payments

## 2. Scope

Create/edit/archive suppliers; order stock; receive any remaining line quantity in multiple deliveries; cancel the remainder; record/void payments, save due dates and inspect supplier totals.

## 3. Ownership

This capability owns its data contracts, state, validation, messages and UI. Business code is not imported from sibling modules.

## 4. Route

/frontend_admin/admin_management/management_purchases

## 5. Entry points

page.tsx, layout.tsx and error.tsx; parent navigation links this page.

## 6. Modes

Staff/Admin preview only. Preview modes are UI controls, not secure authorization.

## 7. Inputs

Received quantities accumulate per line. Only received units create stock movements. Open incoming stock excludes received quantities. Payable is the full order amount, or received-goods value after cancellation. Payments cannot exceed payable. Cancellation is blocked until excess payments are reconciled. Voiding corrects an incorrect record; it does not issue a supplier refund.

## 8. Outputs

Create/edit/archive suppliers; order stock; receive any remaining line quantity in multiple deliveries; cancel the remainder; record/void payments, save due dates and inspect supplier totals.

## 9. Data model

Main shop schema version 1 plus operations document version 1 with backward-compatible optional/defaulted additions.

## 10. State

Owner-local validated state with opaque document subscriptions. External files are parsed as data.

## 11. Persistence

clothes-shop.demo.next.v1 and clothes-shop.operations.v1. Complete backup also includes offers and Studio. Reminder timestamp is optional local metadata.

## 12. Validation

Received quantities accumulate per line. Only received units create stock movements. Open incoming stock excludes received quantities. Payable is the full order amount, or received-goods value after cancellation. Payments cannot exceed payable. Cancellation is blocked until excess payments are reconciled. Voiding corrects an incorrect record; it does not issue a supplier refund.

## 13. Transactions

Read current state, validate and compare expected raw snapshots before saving. Use one editing tab. Ordinary storage errors attempt rollback.

## 14. Workflow

Create/edit/archive suppliers; order stock; receive any remaining line quantity in multiple deliveries; cancel the remainder; record/void payments, save due dates and inspect supplier totals.

## 15. Integration

Generic transport passes document strings; each owner duplicates the required business contracts.

## 16. Money and units

Integer paise and whole quantities. Display currency INR. Existing receipt prices are never recomputed from current catalogue prices.

## 17. Reporting semantics

Received quantities accumulate per line. Only received units create stock movements. Open incoming stock excludes received quantities. Payable is the full order amount, or received-goods value after cancellation. Payments cannot exceed payable. Cancellation is blocked until excess payments are reconciled. Voiding corrects an incorrect record; it does not issue a supplier refund.

## 18. Errors

Show invalid input or storage errors. Failed validation does not save partial data. Complete restore is available for mismatched documents.

## 19. Accessibility and theme

Co-located English messages, semantic theme tokens, native labelled controls and scrollable wide tables. Browser/mobile/physical print verification is not certified.

## 20. Verification

Release checks record TypeScript, lint, architecture, isolated source compilation and production build. No unit/component/E2E tests added or executed.

## 21. Limitations

Old received orders without receivedQty are treated as fully received. Partial receipts and cancelled remainders preserve all posted stock. No payment transfer, supplier refund workflow or accounting certification.

## 22. Maintenance

Keep capability file/line ceilings and absolute owner imports. See FINAL_PROJECT_DELIVERY.md and docs/RETAIL_WORKFLOWS_1_1.md for current behavior.
