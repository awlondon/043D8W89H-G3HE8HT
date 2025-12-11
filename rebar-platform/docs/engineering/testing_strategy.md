# Testing Strategy

- Unit tests in each package/service for business logic (NestJS providers, TS utilities, Python modules).
- Contract tests between core-api and OCR/optimization services using mocked HTTP clients.
- E2E flows for web dashboard and field tablet once APIs stabilize.
- CI pipeline to run lint + tests for all workspaces and Python services.
