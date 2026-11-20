---
module: showroom_studio
version: 0.8.0
status: implemented
---

# Style Studio

## 1. Purpose

Browser-only product exploration and explicitly approximate style overlays.

## 2. Scope

Angle sequence, colour comparison, actual garment measurements, mannequin and personal-photo overlay.

## 3. Ownership

All business implementations live in showroom_studio. No sibling business imports.

## 4. Routes

/frontend_admin/admin_showroom/showroom_studio; opened from the Showroom link.

## 5. Entry points

page.tsx renders AdminShowroomStudioMain; error.tsx provides retry.

## 6. Roles

Demo staff/customer mode is not secure authorization. Staff configuration is hidden in Customer preview mode.

## 7. Inputs

Main catalogue snapshot; user-supplied product cutouts, garment measurements, optional customer photo.

## 8. Outputs

Saved studio settings, JSON backup, optional PNG appearance preview.

## 9. Data model

Local Zod catalogue projection and preferences record keyed by product ID; overlays keyed by colour.

## 10. State

Component-local UI/photo state. Independent studio settings document, no shared business store.

## 11. Persistence

clothes-shop.style-studio.v1; main catalogue is read-only. Each mutation uses opaque compare-and-replace transport.

## 12. Validation

Image MIME/10 MB limit, dimension check, cutout transparency check, finite positive measurement bounds, bounded validated JSON.

## 13. Transactions

Only studio settings are mutated. No sale, stock or billing mutations.

## 14. Interactions

Swipe/keyboard angle navigation, sequence ordering, 3-colour comparison, unit conversion, 3-point alignment, drag and sliders.

## 15. Accessibility

Labelled fields, status/error announcements, keyboard controls for photo navigation and overlay position. Device/a11y audit remains pending.

## 16. Theme

Existing semantic CSS tokens, responsive layouts, native controls and co-located English next-intl messages. Canvas/mannequin use their own drawing assets.

## 17. Privacy

Customer image remains in tab memory; no analytics/network upload/persistence. Explicit consent and clear-photo button. User-requested download saves a PNG.

## 18. Errors

Invalid data, unavailable/full storage, unreadable images, incomplete measurements and missing cutouts have visible messages.

## 19. Portability

Own fixture/contracts/schema/hooks/components. Host supplies React/Next, generic UI, opaque browser-document transport and mannequin public asset.

## 20. Verification

Typecheck, lint, architecture and isolated source compilation; production static build. No unit/component/E2E tests requested.

## 21. Limitations

No AI, segmentation, body detection, real 3D, exact sizing, cloth physics or automatic recolouring. Footwear/accessory size recommendation is not supported.

## 22. Maintenance

Update this module independently. Keep the 25-file ceiling. Backup studio data separately from the main shop snapshot. See STYLE_STUDIO_DELIVERY.md.
