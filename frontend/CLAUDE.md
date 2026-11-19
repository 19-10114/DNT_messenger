# CLAUDE.md - Context and Conventions Guide

Moto Candela admin dashboard (branches, inventory, orders, transactions, reports, surveys, used bikes) + public landing. See `ARCHITECTURE.md` for the full map of reusable components, hooks, services and stores.

## Project Commands

Package manager: **pnpm 8** (`engine-strict`, Node **>= 18**, `.nvmrc` = v18.0.0). Do not use npm/yarn.

| Task | Command |
| --- | --- |
| Dev server | `pnpm dev` (Next dev on **port 3001**) |
| Build | `pnpm build` |
| Start (prod) | `pnpm start` |
| Lint | `pnpm lint` (`next lint`, extends `next/core-web-vitals`) |
| Type check | `pnpm typescript:check` (`tsc --project ./tsconfig.json`, `noEmit`) |
| Format | `pnpm prettier:format` |
| Format check | `pnpm prettier:check` (checks `./src`) |
| Add a shadcn component | `pnpm shad <name>` |

- **There is no test runner configured.** Do not invent `pnpm test`; verify changes with lint + type check (and the dev server when a UI change needs eyes on it).
- **Run the scripts through pnpm (`pnpm build`, `pnpm lint`, …) and never pipe or redirect the build's output.** On this machine (Windows + PowerShell 5.1) `next build` piped into `Select-String` / `Select-Object`, or redirected with `2>&1`, dies with `EPERM: … .next\trace` or hangs; bare `pnpm build` works. An interrupted build leaves that file locked, so the next run fails too until the stray process is gone. Prefer `pnpm typescript:check` + `pnpm lint` for quick verification and keep the full build unpiped.
- **Husky hooks** — `pre-commit`: lint → prettier:format → prettier:check → typescript:check. `pre-push`: lint → prettier:check → typescript:check. Any of these failing blocks the commit/push, so run `pnpm lint && pnpm typescript:check` before finishing a task.
- **Env:** `NEXT_PUBLIC_API_URL` (falls back to `http://localhost:8000/api`), `NEXT_PUBLIC_TOKEN`. See `.env.local.example`.

## Stack and Code Conventions

### Stack
- **Next.js 13.4 App Router** + **React 18** + **TypeScript 5.1** (`strict: true`).
- **Tailwind CSS 3.3** + **shadcn/ui** over **Radix UI**, variants via `class-variance-authority`, class merging via `cn()` (`src/lib/utils.ts`). Theme colors are CSS variables (`--primary`, `--background`, …) defined in `src/app/globals.css`; `darkMode: 'class'`.
- **@tanstack/react-query v4** for server state · **zustand v4** for client state.
- **react-hook-form + zod** (`@hookform/resolvers`) for forms.
- **axios** behind `MotoCandelaHttpService`.
- Other notable deps: `echarts`, `embla-carousel`, `framer-motion`, `lucide-react`, `xlsx`, `docxtemplater`, `@react-pdf/renderer`, `react-to-print`, `date-fns`, `use-debounce`, `js-cookie`, `html2canvas` (captura de pantalla para los reportes de soporte, importado bajo demanda), `pdfjs-dist` ("Subir Factura": parte el PDF en páginas, importado bajo demanda; ver `invoicePdf.utils.ts` por el worker).

### Formatting & imports
- Prettier: single quotes, semicolons, trailing comma `es5`, 2 spaces, print width 80. Never hand-format against this.
- Always import through the `@/*` alias (`@/components/...`, `@/hooks/...`). External packages first, then internal.
- Mark client components with `'use client'` — required for anything using hooks, stores, or browser APIs.

### Naming & export patterns
- Files: `thing.component.tsx` (components), `useThing.ts` (hooks), `thing.service.ts` (services), `thing.store.ts` (stores), `thing.schema.ts` (Zod), `thing.model.ts` (interfaces), `thing.utils.ts` (helpers).
- Components: `PascalCase`, **named exports** (`export function ClientSearch(...)`). Default exports exist only in a few legacy files — prefer named.
- Services: exported **classes** (`export class ProductsService`), instantiated at module scope in the consuming hook (`const productsService = new ProductsService()`).
- Hooks: named exports, re-exported from barrels (`hooks/index.ts`, `hooks/products/index.ts`, `hooks/surveys/index.ts`).
- Props: local `interface XProps` above the component; extend the native element props when wrapping HTML/Radix elements.
- UI copy is in **Spanish**; code, identifiers and comments-of-record in English (existing comments are mixed — match the file you are editing).

### Architecture guidelines
- `src/app/**` = routes, layouts, metadata only. Pages are thin wrappers over a feature component in `src/components/`. No business logic in route files.
- `src/components/ui/` = the design system. **Reuse before creating.** Extend with `className` + CVA variants; never fork a primitive. Domain UI goes in `components/tables|modals|forms|<domain>/`.
- `src/hooks/` = all data fetching. Components must not call a service or axios directly for reads — they consume a hook that wraps React Query. Return objects with named fields (`{ surveys, isLoadingSurveys, refetchSurveys }`), not raw query results, for domain hooks.
- `src/services/<domain>/` = API layer, one class per domain, response types under `types/`. **Every** request goes through `MotoCandelaHttpService` so the base URL and `Authorization: Token <token>` stay centralized.
- **Server state = React Query, client state = Zustand.** Never mirror API data into a store. Read auth with `useToken()`/`useUser()` and the active branch with `useCurrentBranchId()`; consume stores via their atomic selector hooks, never the whole store.
- Query keys follow `[domain, token, params]`. Cache presets live in `src/config/queryOptimization.config.ts`.
- Forms: schema in `src/schemas/*.schema.ts` → `zodResolver` → render through `Form`/`FormField` from `components/ui/form.component.tsx`.
- Route protection is two-layered: `src/middleware.ts` (Edge, `token` cookie) + `RoutesProtectionProvider` (client, revalidates the session).
- Shared types: `src/models/` (domain interfaces) or `services/<domain>/types/` (API shapes). Constants and route paths in `src/constants/`.

### Known debt — do not propagate
- `components/ui/button.tsx` duplicates `button.component.tsx` → use `button.component.tsx`.
- `hooks/useCarouselImages copy.ts` is dead → use `useCarouselImages.ts`.
- `schemas/modifyUser,schema.ts` has a comma in its filename.
- `services/user` (create/modify) and `services/users` (listings/roles) overlap.

## Maintenance Rules

- **ARCHITECTURE.md:** whenever we create, modify, or delete a reusable component, custom hook, API service, or global state (store), update `ARCHITECTURE.md` automatically at the end of the task — including its `Last updated` date. Purely local, single-use components do not require an update.
- Keep `AGENTS.md` and `GEMINI.md` consistent if a convention documented there changes.
- Run `pnpm lint` and `pnpm typescript:check` before declaring a task complete; the Husky hooks will run them anyway.
