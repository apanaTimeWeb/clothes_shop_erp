---
module: management_customers
version: 1.1.0
status: implemented
---

# Customers, purchase history and privacy

## 1. Purpose

Customers, purchase history and privacy

## 2. Scope

Customer search/edit/archive, receipt links, earned/redeemed points and history. Anonymise name, phone, email, preferences and reward free-text while retaining anonymous receipt/points references.

## 3. Ownership

This capability owns its data contracts, state, validation, messages and UI. Business code is not imported from sibling modules.

## 4. Route

/frontend_admin/admin_management/management_customers

## 5. Entry points

page.tsx, layout.tsx and error.tsx; parent navigation links this page.

## 6. Modes

Staff/Admin preview only. Preview modes are UI controls, not secure authorization.

## 7. Inputs

Checkout links selected customers automatically. Manual rewards remain available as a ledger. Earn one point per INR 100 net paid per receipt. Checkout redeems at INR 1 per point before tax. Refunds reduce earned points; previously spent points are not automatically reinstated.

## 8. Outputs

Customer search/edit/archive, receipt links, earned/redeemed points and history. Anonymise name, phone, email, preferences and reward free-text while retaining anonymous receipt/points references.

## 9. Data model

Main shop schema version 1 plus operations document version 1 with backward-compatible optional/defaulted additions.

## 10. State

Owner-local validated state with opaque document subscriptions. External files are parsed as data.

## 11. Persistence

clothes-shop.demo.next.v1 and clothes-shop.operations.v1. Complete backup also includes offers and Studio. Reminder timestamp is optional local metadata.

## 12. Validation

Checkout links selected customers automatically. Manual rewards remain available as a ledger. Earn one point per INR 100 net paid per receipt. Checkout redeems at INR 1 per point before tax. Refunds reduce earned points; previously spent points are not automatically reinstated.

## 13. Transactions

Read current state, validate and compare expected raw snapshots before saving. Use one editing tab. Ordinary storage errors attempt rollback.

## 14. Workflow

Customer search/edit/archive, receipt links, earned/redeemed points and history. Anonymise name, phone, email, preferences and reward free-text while retaining anonymous receipt/points references.

## 15. Integration

Generic transport passes document strings; each owner duplicates the required business contracts.

## 16. Money and units

Integer paise and whole quantities. Display currency INR. Existing receipt prices are never recomputed from current catalogue prices.

## 17. Reporting semantics

Checkout links selected customers automatically. Manual rewards remain available as a ledger. Earn one point per INR 100 net paid per receipt. Checkout redeems at INR 1 per point before tax. Refunds reduce earned points; previously spent points are not automatically reinstated.

## 18. Errors

Show invalid input or storage errors. Failed validation does not save partial data. Complete restore is available for mismatched documents.

## 19. Accessibility and theme

Co-located English messages, semantic theme tokens, native labelled controls and scrollable wide tables. Browser/mobile/physical print verification is not certified.

## 20. Verification

Release checks record TypeScript, lint, architecture, isolated source compilation and production build. No unit/component/E2E tests added or executed.

## 21. Limitations

Anonymisation affects current structured customer fields only. Downloaded backups are unchanged. Anonymous records remain archived with consent false. No remote customer messaging or secure user accounts.

## 22. Maintenance

Keep capability file/line ceilings and absolute owner imports. See FINAL_PROJECT_DELIVERY.md and docs/RETAIL_WORKFLOWS_1_1.md for current behavior.
