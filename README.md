# clothes_shop_erp

Frontend-only Smart Clothing Digital Showroom & Retail Management ERP demonstration, built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Zustand following the WET 0.5.0 integration contract.

## Tech Stack

- **Framework**: Next.js 16 (Static Export)
- **UI & Styling**: React 19, Tailwind CSS v4, Radix UI, Lucide Icons
- **State & Validation**: Zustand, Zod
- **Persistence**: Generic Browser Document Protocol (`clothes-shop.demo.next.v1`) via `browser_document.ts`
- **Testing**: Vitest (Unit/Component), Playwright (E2E)

## Architecture

The project adheres to the **WET 0.5.0 (Write Everything Twice)** contract:
- Canonical domain structure under `src/app/frontend_admin/admin_<domain>/<domain>_<capability>/`.
- Each capability contains its own local state, schemas, mocks, locales, and components with the `Admin<Domain><Capability>` naming prefix.
- Zero business logic cross-imports across capabilities.
- Opaque document storage with stale-state detection for tab synchronization.

For detailed architecture guidelines, see [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md).

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npx next dev
   ```

3. **Build static export**:
   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm run test
   ```
