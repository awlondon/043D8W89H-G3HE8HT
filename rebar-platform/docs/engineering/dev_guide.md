# Developer Guide

## Prerequisites
- Node.js 18+ and pnpm.
- Python 3.11+.
- Docker for local Postgres.

## Setup
1. `pnpm install`
2. Start databases and services (to be scripted in `scripts/dev/start_all.sh`).
3. Run Prisma migrations from `services/core-api` once connected to Postgres.

## Services
- Core API: NestJS on port 3000.
- OCR Service: FastAPI on port 8000.
- Optimization Service: FastAPI on port 8001.
- Voice Sales Agent API: NestJS on port 3100.

## Frontends
- Web dashboard: Next.js dev server on port 3001 (configurable).
- Field tablet app: React Native/Expo targetting Android tablets.
