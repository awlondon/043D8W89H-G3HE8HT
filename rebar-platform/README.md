# Rebar Platform Monorepo

This monorepo hosts applications and services for the rebar fabrication platform, including offline-first field tools, backend APIs, optimization engines, AI sales automation, and supporting infrastructure.

## Structure

- **apps/**: User-facing applications (React Native field tablet, Next.js web dashboard, voice sales agent API wrapper).
- **services/**: Backend microservices (NestJS core API, OCR, bending engine, optimization service).
- **ai/**: Conversation logic, knowledge base content, and experiments for the AI voice agent and RAG stack.
- **packages/**: Shared TypeScript types, UI components, and utilities.
- **infra/**: Terraform, Kubernetes manifests, and CI/CD workflows.
- **data/**: Sample job sheets and call transcripts for development and testing.
- **docs/**: Product specs, engineering guides, sales collateral, and legal templates.
- **scripts/**: Developer helpers and data generation tools.

## Features

- Pallet planning: layer-by-layer stacking plans that keep pallets within forklift weight limits and reduce restacking.

## Getting Started

Install dependencies with pnpm (recommended) to take advantage of the workspace setup:

```bash
pnpm install
```

Useful scripts (to be implemented by individual packages):

```bash
pnpm dev:api      # Start the core API (NestJS)
pnpm dev:web      # Start the web dashboard (Next.js)
pnpm dev:tablet   # Start the React Native field tablet app
```

## Documentation

- [MVP Workflow Spec](docs/product/mvp_spec.md)
- [Pallet Planning Spec](docs/product/pallet_planning.md)

Refer to `docs/engineering/dev_guide.md` for local environment setup, data seeding, and service orchestration.
