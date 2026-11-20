# WET integration contract — 0.5.0

## Ownership

Canonical source shape: `src/app/frontend_admin/admin_<domain>/<domain>_<capability>/`. Each capability contains local business code in canonical subfolders with its full `Admin<Domain><Capability>` filename prefix. Domain root contains only navigation/redirect wrappers and its documentation trio. Route config imports by host navigation are allowed; business cross-imports are not.

`docs/WET_OWNERSHIP.json` enumerates owners and allowed action types. There is no global `src/demo`, shared business utility library, global business Zustand store or compatibility facade.

## Generic host contracts

- `src/lib/browser_document.ts`: opaque string read/compare-and-replace/subscribe transport, plus ephemeral UI string preference/notice transport. No retail records or mutations.
- `src/lib/routes.ts`: navigation registration from module URL configs only.
- `src/components/ui/`: Button, Confirm and LocaleProvider only.
- `src/app/layout.tsx`, global CSS and framework routing: theme, fonts and framework composition.

Exact signatures for isolated compilation are duplicated in each module’s `contracts/host-stubs.d.ts`. A consuming host must supply actual runtime implementations of those infrastructure contracts; declarations are not a runtime harness.

## State protocol

All local copies understand schema version 1 and storage key `clothes-shop.demo.next.v1`. Preserve the existing record identities and invoice snapshots. UI → local store → local permitted transition → local schemas/invariants → generic document commit. The transport compares the exact expected saved string before writing. A quota/validation/stale-state failure does not publish the candidate. Same-tab subscribers hydrate their own local snapshots; another browser tab marks them stale instead of silently merging.

This is an explicit saved-document integration contract. It provides no shared mutable business-store object, cross-feature mutation call or server cache. It also does not provide production transaction guarantees. Export JSON before changing the schema. Changes to the persisted wire shape require coordinated local contract/fixture updates, not a new shared business layer.

## Management routes

The former `/frontend_admin/admin_management/management_workspace/` implementation is removed. Parent navigation links to `management_catalogue`, `management_intake`, `management_stock`, `management_images`, `management_returns` and `management_vocabulary`. There is no parallel compatibility route tree. Update any externally saved bookmark to one of these current routes.

## Checks

Run root source checks from README. `check:portability` creates temporary isolated copies of all 15 capabilities, exposes no sibling source, compiles runtime source with ambient contracts and removes the copies afterwards. Unit/component/E2E execution remains deferred at the user's request. Tests moved during ownership repair are not advertised as freshly passing.
