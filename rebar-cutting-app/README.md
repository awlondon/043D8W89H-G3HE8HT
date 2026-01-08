# Rebar Cutting Tablet App

Monorepo for an offline-first tablet application that recognizes rebar, optimizes 1D cut plans, and keeps minimum-length rules enforced in shared domain logic.

## Workspace Layout

```
rebar-cutting-app/
├── apps/
│   ├── tablet
│   └── backend
├── packages/
│   ├── core
│   └── shared
└── docs/
```

## Requirements
- Node.js 18+
- pnpm 9+

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm --filter @rebar/tablet start
pnpm --filter @rebar/backend dev
```

## Testing

```bash
pnpm --filter @rebar/core test
```

## Documentation
See the `docs/` directory for architecture, optimizer behavior, API contracts, and data model definitions.
