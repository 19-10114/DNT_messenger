# Project Overview

This is a Next.js web application for "MOTO CANDELA", which serves as an administration dashboard. It is built with TypeScript, Next.js, and Tailwind CSS. The application is designed to manage information such as products, categories, clients, users, and permissions.

## Architecture

The project follows a component-based architecture. It uses a service layer for API communication, custom hooks for state management, and a clear separation of concerns between UI components, data models, and business logic.

- **Frontend:** Next.js (React) with TypeScript
- **Styling:** Tailwind CSS with `shadcn-ui` and Radix UI components.
- **State Management:** Zustand and TanStack React Query are used for managing global and server state.
- **Forms:** `react-hook-form` is used for form handling, with `zod` for schema validation.
- **API Communication:** A dedicated `MotoCandelaHttpService` class wraps `axios` to handle HTTP requests to the backend API. It includes authentication handling by attaching a token to the headers.
- **Authentication:** The application uses token-based authentication. A middleware protects all routes under `/dashboard`, redirecting unauthenticated users to the home page (`/?next=…`), where they sign in with the landing navbar modal and are sent back to the original route.

# Building and Running

The project uses `pnpm` as the package manager.

## Setup

1.  **Install Node.js:** Make sure you have Node.js version 18.0.0 or higher. It is recommended to use `nvm` (Node Version Manager) to manage Node.js versions.
2.  **Install pnpm:** Install `pnpm` globally using `npm install -g pnpm`.
3.  **Install Dependencies:** Run `pnpm install` in the project root to install all the necessary dependencies.

## Development

To run the application in development mode, use the following command:

```bash
pnpm dev
```

This will start the development server on `http://localhost:3001`.

## Production

To build the application for production, use:

```bash
pnpm build
```

Sin pipes ni redirecciones: en Windows/PowerShell, pipear la salida del build
(`| Select-String`, `2>&1`) falla con `EPERM: … .next\trace` o se cuelga.

To start the production server, use:

```bash
pnpm start
```

# Development Conventions

## Linting and Formatting

- **Linting:** The project uses ESLint to enforce code quality. Run `pnpm lint` to check for linting errors.
- **Formatting:** Prettier is used for code formatting. Run `pnpm prettier:check` to check for formatting issues and `pnpm prettier:format` to automatically format the code.
- **TypeScript:** The project uses TypeScript for static typing. Run `pnpm typescript:check` to check for TypeScript errors.

## Git Hooks

The project uses Husky for Git hooks. There are pre-commit and pre-push hooks configured to run checks before committing and pushing code.

## API Service

All communication with the backend API should go through the `MotoCandelaHttpService`. This ensures that all requests are consistent and that authentication is handled correctly. The base URL for the API is configured using the `NEXT_PUBLIC_API_URL` environment variable.

## State Management

- For server state (fetching, caching, and updating data from the API), use `@tanstack/react-query`.
- For global client state, use `zustand`.

## Components

- Reusable UI components are located in the `src/components` directory.
- When adding new components, follow the existing structure and naming conventions.
- For UI components, prefer using `shadcn-ui` and Radix UI components.
