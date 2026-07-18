# Backend integration roadmap + Pass 1 (client foundation)

**Date:** 2026-07-18  
**Status:** Pass 1 implemented; later passes sequenced only

## Roadmap (dependency-first)

| Pass | Name | Progress.md focus |
|------|------|-------------------|
| 0 | Auth live verification | Clear remaining `[~]` auth items when backend `/auth/*` works |
| 1 | Client foundation | `204`, `ApiError`, query helper, no-401-retry, shared query keys |
| 2 | Existing app hardening | Library errors, invalidation audit, user-scoped recents |
| 3 | Authenticated downloads | Compile blob + export `{ url }` + `/exports` resolve |
| 4 | Book shape & style | `BookResponse` fields + outline style body + home form |
| 5 | Generation API coverage | `POST /books`, `generate-chapter`, moderate |
| 6 | Analytics | `GET /stats` + UI |
| 7 | Projects + API keys | §5 |
| 8 | Templates | §6 |
| 9 | Webhooks | Only if UI needs them |
| 10 | Lint/typecheck hygiene | Scoped cleanup |

## Pass 1 design (done)

- `ApiError` with `status`; shared detail flattening for `request` + login
- `204` / empty body → `undefined` (no `res.json()`)
- `buildQuery` for future list filters
- `shouldRetryQuery` wired into root `QueryClient`
- `queryKeys` factory; routes migrate to it; `authMeQueryKey` aliases `queryKeys.authMe`
- Tests: `src/lib/api.test.ts`, `src/lib/query-keys.test.ts`

## Out of scope for Pass 1

Downloads, library error UI, recent-books scoping, new domain endpoints/pages.
