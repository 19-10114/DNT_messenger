# Agent Guidelines for moto-candela-fe

## Commands

- **Build**: `pnpm build`
- **Lint**: `pnpm lint` (ESLint with Next.js config)
- **Type Check**: `pnpm typescript:check`
- **Format**: `pnpm prettier:format`
- **Dev**: `pnpm dev` (runs on port 3001)
- Run the build through pnpm and **never pipe or redirect its output**: on Windows/PowerShell, `next build | Select-String` (or `2>&1`) dies with `EPERM: … .next\trace` or hangs. Bare `pnpm build` works.

## Code Style

- **Imports**: Use `@/*` path aliases, group external imports first, then internal
- **Formatting**: Prettier config (single quotes, trailing commas es5, 2 spaces)
- **Components**: Use PascalCase for components, kebab-case for files
- **Types**: Strict TypeScript enabled, use interfaces for object shapes
- **UI**: Use shadcn/ui components with class-variance-authority patterns
- **Services**: Follow MotoCandelaHttpService pattern for API calls
- **State**: Use Zustand for global state management
- **Forms**: Use react-hook-form with Zod schemas
- **Styling**: Tailwind CSS with cn() utility for class merging
