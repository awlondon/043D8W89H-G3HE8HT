# Architecture

- **apps/field-tablet-app**: React Native client, offline-first with background sync.
- **apps/web-dashboard**: Next.js admin and operations dashboard hitting the core API.
- **services/core-api**: NestJS API + Prisma/PostgreSQL for projects, job sheets, workflows, leads, deals, and commissions.
- **services/ocr-service**: FastAPI OCR + parsing microservice for job sheets.
- **services/optimization-service**: Cutting stock/bin-packing microservice.
- **services/bending-engine**: Shared bending formula library.
- **ai/voice_agent**: State machine + prompts; invoked by voice-sales-agent-api or external workers.
- **packages/**: Shared types, UI, and utilities across apps.
- **infra/**: Terraform, Kubernetes manifests, CI/CD pipelines.
