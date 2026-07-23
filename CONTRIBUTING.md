# Contributing

## Workflow

1. Branch from `main`. Naming: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.
2. Commit using [Conventional Commits](https://www.conventionalcommits.org). `commitlint` runs on `commit-msg`.
3. Run locally before pushing:

   ```bash
   pnpm typecheck
   pnpm --filter @back2u/api test
   ```

4. Open a PR against `main`. CI runs lint, typecheck, unit, integration, HTTP smoke, and a Dockerfile build verification.
5. Squash-merge after green + 1 review.

## Layout cheatsheet

- Domain logic → `apps/api/src/domain/**` (no framework imports)
- Use cases → `apps/api/src/application/use-cases/**`
- Infrastructure adapters → `apps/api/src/infrastructure/**`
- HTTP routes → `apps/api/src/interfaces/http/routes/**`
- DI wiring → `apps/api/src/composition/container.ts`

Adding a new feature usually means: domain entity → use case → port (if a new external service) → infrastructure adapter → HTTP route → api-client method → frontend page.

## Testing rules

- Domain entities: pure unit tests, no Mongo, no DI.
- Use cases / repos: integration tests against `mongodb-memory-server`.
- HTTP routes: supertest against `buildApp(buildContainer())`.
- E2E: Playwright against the running web app (scheduled only — keep CI fast).

Coverage thresholds: 50% lines/branches/functions/statements (raise as you add specs).
