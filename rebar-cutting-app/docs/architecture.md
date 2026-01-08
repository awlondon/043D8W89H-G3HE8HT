# Architecture

## Overview
The system is a production-ready monorepo that separates concerns across the tablet UI, shared domain logic, and an optional backend service.

## Packages

- `apps/tablet`: Expo-based React Native application used on tablets. It runs the optimizer locally for offline-first cut planning and stores jobs in SQLite.
- `apps/backend`: Fastify server that provides an online-only proxy to the AI recognition service. It does **not** generate cut plans.
- `packages/core`: Shared domain models, validation, and deterministic 1D cutting optimization logic.
- `packages/shared`: Cross-cutting constants and shared utilities, including the global minimum part length constant.

## Data Flow
1. Tablet captures images and sends them to the optional backend proxy when online.
2. The recognition service returns detected rebar lengths and counts.
3. The tablet constructs a `Job` and invokes the optimizer locally (`packages/core`).
4. The cut plan is stored locally in SQLite for offline execution.

## Offline-First Guarantees
- Cut plans are generated entirely inside the tablet app using the shared core package.
- Job persistence and review are handled with SQLite on the device.

## Separation of Concerns
- UI and storage code live in `apps/tablet`.
- Optimization, validation, and domain models live only in `packages/core`.
- The backend only proxies recognition requests and never generates cut plans.
