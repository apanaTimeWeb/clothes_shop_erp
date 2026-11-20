---
module: admin_management_intake
version: 0.5.0
status: wet-ownership-repaired
---

# Management Intake

## 1. Scope and Non-Scope (Module Purpose, System Context & Dependencies)

Guided new/existing design intake with staged photos, colour/size matrix, multiple destination boxes, review and atomic opening-stock/restock commit. Frontend-only fictional MVP; no backend, authentication, real payments or tax-invoice certification.

### Approved External Dependencies & Expected Host Contract

- `@/lib/browser_document`: `readDocument(key): string | null`, `commitDocument(key, expectedRaw, nextRaw): void`, `subscribeDocument(key, changed, external): unsubscribe`. This transport stores opaque strings and owns no schemas, inventory, billing rules, seeds or Zustand store.
- The same neutral transport exposes string session-value read/write/subscription for preview mode and notices. Each capability locally interprets its values.
- `@/lib/routes`: navigation metadata only, assembled from capability URL configs; no business functions.
- `@/components/ui/Button`, `Confirm`, `LocaleProvider`: business-free primitives. Expected prop contracts are declared in `contracts/host-stubs.d.ts`.
- Host dependencies: React, Next.js, next-intl, Zustand, Zod, form/dialog/icon packages listed in the root lockfile. CSS tokens come from the global theme contract. There are no sibling business imports.

## 2. Screen Inventory & Component Responsibility Map

| Owned component                        | Responsibility                                             |
| -------------------------------------- | ---------------------------------------------------------- |
| `AdminManagementIntakeIntake.tsx`      | Intake presentation / interactions in this capability      |
| `AdminManagementIntakeMatrix.tsx`      | Matrix presentation / interactions in this capability      |
| `AdminManagementIntakePhotoPicker.tsx` | PhotoPicker presentation / interactions in this capability |

`layout.tsx` (or the navigation boundary) owns local localization and store connection. `state/AdminManagementIntakeStore.ts` owns its Zustand instance; `state/AdminManagementIntakeTransactions.ts` owns permitted transitions; `state/AdminManagementIntakeIntegrity.ts` validates persisted-document relationships.

## 3. Navigation Contract & User Flows

Canonical route: `/frontend_admin/admin_management/management_intake/`. URL/label metadata is owned by `config/admin_management_intake.url_config.ts`. Navigation through the host registry is allowed; importing a sibling store, reducer or component is forbidden.

## 4. API Contract & UI Data Requirements

No HTTP API or server-state service is present. Local `useAdminManagementIntake` exposes a typed state snapshot, `dispatch(action): boolean`, readiness/stale flags and notice/mode controls. Full snapshot shape lives in `types/AdminManagementIntakeTypes.ts` and `types/AdminManagementIntakeCommerce.ts`. Inputs are validated locally; imported/persisted snapshots use local Zod schemas.

## 5. Query Key Registry & Server State

No TanStack Query keys or API cache are used: there is no async server data in this explicitly frontend-only MVP. Local UI inputs stay component-private; the capability-local Zustand snapshot is populated from the persisted demo document.

## 6. Mutation Inventory & Lifecycle Operations

Allowed action types: `manage-intake`. The local transition function clones before mutation, applies its allowed-action gate, validates the resulting snapshot and publishes only after storage succeeds. Competing external writes are rejected.

## 7. Permissions and Role Rules

Admin preview required by the local layout for editing. These are visual demo modes, never authentication. Customer display hides operational/cost/profit UI at the workspace boundary.

## 8. State Ownership & Architecture Flow

UI → capability-local store → capability-local transition/schema → opaque compare-and-replace storage transport. Same-tab notifications reload each mounted capability’s independent snapshot. There is no shared business Zustand instance, sibling mutable-store import or global reducer. JSON persistence is the explicit product contract that keeps the cross-screen demo coherent.

## 9. Offline, Loading, Empty, and Error States

The route reserves a minimum-height loading area before local hydration. Native form constraints and host notices surface validation/storage errors. `error.tsx` provides a scoped retry fallback. Empty lists retain navigation/recovery controls. Corrupt state shows a visible seed-recovery warning; quota failure retains the last saved state.

## 10. Security and PII Rules (Data Masking & Guards)

Only fictional sample records or anonymous sessions should be entered. No secrets, payment credentials or real personal data are required. Browser JSON is inspectable and not secure storage. Browser preview modes do not enforce authorization.

## 11. Accessibility Requirements (A11y)

Semantic labelled controls, visible focus, Radix modal behavior, keyboard-accessible navigation and reduced-motion CSS are retained. Full assistive-technology, touch and print checks are deferred; no blanket WCAG certification is claimed.

## 12. Background Tasks & Realtime Events

Local document/session-value subscriptions are connected on capability mount and removed on unmount. External storage changes mark the current tab stale. The browser has no background network sync or polling service.

## 13. Feature Flags & Tenant Settings

Single fictional shop, no tenant/account system. Shop name/tax/threshold come from the demo snapshot. No feature depends on unprovided backend flags or credentials.

## 14. Cache Invalidation & Consistency

One persisted demo document (`clothes-shop.demo.next.v1`) is the source of saved data. Each mounted module keeps a local decoded read model and receives neutral document-change notifications. Successful writes refresh same-tab read models; external-tab changes require reload. This is not production concurrent transaction safety.

## 15. Migration, Rollback & Edge Cases (AI Warnings)

Schema version 1 remains compatible with the prior ZIP. Public screen links use current route registration. The former management_workspace tab container is removed and replaced by six canonical sibling capabilities. Back up JSON before trying another build. Reload a stale tab instead of overwriting another tab’s state.

## 16. Test Coverage Map & Quality Gates

Source checks: full-project TypeScript, ESLint, stricter architecture/import-cycle checks and isolated-copy capability compilation. Existing test source was mechanically relocated/repointed where needed for ownership. Unit/component/E2E tests were not added or executed; their behavioural assertions are not newly certified.

## 17. Architecture Exceptions (ADRs)

Explicit user directions control Next.js, frontend-only fixtures and deferred test work. Master prompt requires local JSON persistence and connected state, overriding generic production bans on browser business persistence/API-only state. Strict WET business ownership is implemented; the prior global-business-store exception is withdrawn. Light retail styling follows the clothing prompt over the generic gym palette.

## 18. Known Contract Gaps & Bug Log

No known unresolved sibling/global-business import is accepted. Runtime browser/device/print verification and strict total-route JS budget certification remain outside the source-only checks. Optional CSV stock import is not implemented. See root WET_REPAIR_REPORT.md for full qualifications.

## 19. Rule Compliance Checklist (35+ Verification Items)

The machine-readable `docs/WET_STRUCTURE_RESULTS.json` records actual folder counts, file-prefix checks, root quarantine, infrastructure allowlist, local documentation, no barrels/sibling imports and runtime-cycle results. Do not treat these structural checks as proof of all production security/performance/visual rules.

## 20. Standalone Run, Mock & Test Harness

User explicitly deferred unit/E2E work. No new mock test harness is advertised as completed. Run the whole demo using root `npm ci` and `npm run dev`. For isolated source compilation, `npm run check:portability` copies this capability into a temporary standalone folder, supplies only declared ambient host contracts and installed dependencies, and excludes test execution.

## 21. Module Portability & Host Integration Guide

Copy this entire `management_intake` directory into the same canonical role/domain path. Supply the documented neutral storage transport, route registry, UI primitives, dependencies and theme. Register only its URL config with navigation. Do not copy a sibling module or add a business shared folder. The isolated-copy compiler check verifies source imports without neighboring feature files.

## 22. Deliverables & Version History (8/8 Portability Score)

Version 0.5.0 WET repair. Source, local schemas/types/fixtures/state, route metadata, documentation trio and ambient host contracts are included. Portability compilation is measured; runtime harness/visual/E2E certification is explicitly not claimed.
