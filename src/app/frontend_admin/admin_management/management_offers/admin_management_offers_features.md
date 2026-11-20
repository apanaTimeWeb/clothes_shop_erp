---
module: management_offers
version: 0.9.0
status: implemented
---

# Product offers

## 1. Purpose

Manage dated product offers and identify slow-selling stock for review.

## 2. Scope

Create/edit/pause/delete product-wide percent or fixed discounts; slow-stock candidates; offer JSON export/import/reset.

## 3. Ownership

management_offers owns the catalogue projection, offer schema, local hook, form, analysis and messages. Showroom and billing duplicate their own consumption contracts.

## 4. Route

/frontend_admin/admin_management/management_offers; navigation-only parent renders the Offers tab.

## 5. Entry points

page.tsx, layout.tsx local next-intl provider and error.tsx retry.

## 6. Modes

Staff/Admin preview can configure offers. Customer mode shows a staff-only message. This is demo visibility, not authorization.

## 7. Inputs

Read-only main shop snapshot; offer title, product, percent or fixed INR value, inclusive India dates, enabled flag.

## 8. Outputs

Independent offers document and JSON backup. Stock and sales are not changed by the manager.

## 9. Data model

Version 1 envelope with at most 1000 uniquely identified offers. Valid ISO dates, finite bounded amounts, start before end.

## 10. State

Independent hook reads/subscribes to opaque main and offers documents. Component-local editor state.

## 11. Persistence

clothes-shop.offers.v1; schema version separate from the base shop and Studio. Backup all three documents separately.

## 12. Validation

Title/product required; integer percentage 1–90; fixed value rounded from two decimal INR input to integer paise; date and payload validation; backup 500KB limit.

## 13. Transactions

Read/validate/compare-and-replace writes; failed writes retain prior data. Frontend demo assumes one active tab; not production concurrent edits.

## 14. Discount policy

Best active single offer per product wins. Percent discount rounds per unit. Fixed discount clamps at base price. Ties use stable ID. Manual bill discount is separate.

## 15. Showroom integration

Catalogue cards/details/comparison display offer prices. Search maximum-price filtering and sorting use the offered unit price. Active state refreshes within 15 seconds.

## 16. Billing integration

Explicit Apply current product offers action on saved drafts. Rechecks current active offers against saved draft prices, retains higher existing line discounts, caps bill discount to remaining subtotal. Historical sales are unchanged.

## 17. Slow-stock definition

Active sellable stock, gross units sold during trailing window <= threshold and product creation age >= threshold. Returns are not subtracted. This is a candidate list, not demand forecasting.

## 18. Errors

Invalid saved data fails closed. Main-shop corruption needs main backup restore; offer corruption can be restored/reset here.

## 19. Accessibility and theme

Semantic host tokens, labelled native controls, confirmation for delete/reset, English module-local next-intl strings. Device/a11y review is not certified.

## 20. Verification

TypeScript, lint, architecture, isolated source compilation and production build. No unit/component/E2E tests requested.

## 21. Limitations

No backend, secure login, real concurrency guarantee, automated campaign publishing, personalized pricing or AI. Drafts keep saved discounts even after expiry.

## 22. Maintenance

No sibling business imports. Keep 25-file and line ceilings; host contracts declare generic UI and opaque persistence. Current release summary is FINAL_PROJECT_DELIVERY.md.
