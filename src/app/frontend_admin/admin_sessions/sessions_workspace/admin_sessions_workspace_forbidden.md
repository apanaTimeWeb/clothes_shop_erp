# sessions_workspace boundaries

- No imports from sibling feature business files, stores, schemas, types, fixtures or UI.
- No `src/demo`, `src/shared`, `src/common` or business-aware code under global `src/lib` / `src/components`.
- Duplicate overlapping business behavior locally; do not add re-export facades or global business registries.
- No loose business files at domain/submodule root. Canonical subfolders and `AdminSessionsWorkspace` filenames are mandatory.
- Only the actions declared in this capability’s transition gate may mutate the saved document.
- No real backend, payments, auth, remote photos or production inventory guarantees.
- No silent stock deduction on selection/retrieval, silent overwrite of concurrent data or mutation after persistence failure.
- Do not claim tests, visual certification or runtime harness execution that were not performed.
- Maintain 3–25 owned files, source-type line ceilings and a runtime import graph without cycles.
