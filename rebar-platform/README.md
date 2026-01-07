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

- Scrap-free results (in practice): the system measures scrap percentage after every run and flags
  runs as scrap-free when they stay under a configurable threshold. Scrap-free rates are tracked by
  operator and by shop.
- Pallet planning: layer-by-layer stacking plans that keep pallets within forklift weight limits and reduce restacking.
- Multi-datum bend compensation: the Bender app uses a three-chart model (stretch, feed, machine datum) to give
  operator-neutral, reproducible bend instructions.

## Getting Started

Install dependencies with pnpm (recommended) to take advantage of the workspace setup:

```bash
pnpm install
```

Useful workspace commands:

```bash
pnpm dev:api                     # Start the core API (NestJS)
pnpm --filter web-dashboard dev  # Start the web dashboard (Next.js)
pnpm dev:tablet                  # Start the React Native field tablet app
```

pnpm workspace filters

This monorepo uses pnpm --filter with package names, not directory paths. If a command reports “No projects matched the filters”, verify that the filter matches the "name" field in the target package’s package.json.

## Documentation

- [Cutter App Spec](docs/product/cutter_app_spec.md)
- [MVP Workflow Spec](docs/product/mvp_spec.md)
- [Pallet Planning Spec](docs/product/pallet_planning.md)
- [AppSheet Rebar Cutting Blueprint](docs/product/appsheet_rebar_cutting_blueprint.md)
- [Decentralized Bench Network Vision](docs/product/decentralized_bench_vision.md)

Refer to `docs/engineering/dev_guide.md` for local environment setup, data seeding, and service orchestration.
