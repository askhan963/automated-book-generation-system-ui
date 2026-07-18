# Backend API integration progress

Track frontend alignment with [`backend-contract.md`](backend-contract.md).
Base URL (local): `http://localhost:8001/api/v1` via `VITE_API_BASE_URL`.
Backend `CORS_ORIGINS` must include the Vite origin (this app uses port **8080**).

Legend: `[ ]` todo · `[~]` partial · `[x]` done

---

## 1. Auth foundation (current pass)

- [x] Token storage helpers (`localStorage`, SSR-safe)
- [x] `request()` attaches `Authorization: Bearer <token>`
- [x] On `401`: clear token + redirect to `/login` (no refresh token)
- [x] Preserve FastAPI `detail` error normalization
- [x] `POST /auth/register` (JSON `{ email, password }` → `User`)
- [x] `POST /auth/login` (form-urlencoded `username`+`password` → token)
- [x] `GET /auth/me` → `User`
- [x] Auth context / `useAuth` (`user`, `token`, `login`, `register`, `logout`, `isLoading`)
- [x] TanStack Query key `["auth", "me"]`
- [x] Mount `AuthProvider` in root
- [x] Local `.env.local` with `VITE_API_BASE_URL`

### Auth screens & guards (next)

- [x] `/login` route (RHF + zod + shadcn Form, sonner toasts)
- [x] `/register` route (same patterns)
- [~] After login/register: fetch `/auth/me`, cache user, redirect to `/library`
- [x] Guard `/library` (redirect unauthenticated → `/login`)
- [x] Guard `/books/$bookId` (redirect unauthenticated → `/login`)
- [~] User menu / logout in `site-header.tsx`
- [x] Hide Library link when logged out

### Authenticated downloads (next)

- [x] `GET /books/{id}/compile` as authenticated blob (not bare `<a href>`)
- [x] Export routes fetched with auth header → `{ url }` then download

---

## 2. Client correctness

- [x] Handle `204 No Content` in `request()` (no `res.json()`)
- [x] Preserve HTTP status on API errors (e.g. `ApiError`)
- [x] Query-parameter helper for list filters
- [x] Resolve export `{ url }` against backend origin (`/exports/...`)
- [x] Align `BookResponse` with contract (`owner_id`, `genre`, `tone`, `audience`, `length`)
- [x] Extend `generateOutline` body: `genre?`, `tone?`, `audience?`, `length?`

---

## 3. Books & generation

| Endpoint                                          | Client | UI  | Notes                                    |
| ------------------------------------------------- | ------ | --- | ---------------------------------------- |
| `GET /health`                                     | [x]    | [x] | Public (`/status`)                       |
| `GET /books`                                      | [x]    | [x] | Needs auth header                        |
| `POST /generate-outline`                          | [x]    | [x] | Style fields wired                       |
| `GET /books/{id}`                                 | [x]    | [x] |                                          |
| `PATCH /books/{id}/outline`                       | [x]    | [x] |                                          |
| `PATCH /books/{id}/final-review`                  | [x]    | [x] |                                          |
| `POST /books/{id}/chapters/next`                  | [x]    | [x] |                                          |
| `GET /books/{id}/chapters`                        | [x]    | [x] |                                          |
| `PATCH /chapters/{id}`                            | [x]    | [x] |                                          |
| `POST /chapters/{id}/regenerate`                  | [x]    | [x] |                                          |
| `GET /books/{id}/draft`                           | [x]    | [x] |                                          |
| `GET /books/{id}/compile`                         | [x]    | [x] | Authenticated blob download              |
| `POST /books`                                     | [x]    | [ ] | Client ready; home uses generate-outline |
| `POST /generate-chapter`                          | [x]    | [x] | Empty-chapter generate action            |
| `POST /books/{id}/chapters/{chapter_id}/moderate` | [x]    | [x] | AI moderate action                       |
| `GET /books/{id}/export/pdf`                      | [x]    | [x] | Returns `{ url }`                        |
| `GET /books/{id}/export/epub`                     | [x]    | [x] |                                          |
| `GET /books/{id}/export/markdown`                 | [x]    | [x] |                                          |
| `GET /books/{id}/export/html`                     | [x]    | [x] |                                          |

Client-side DOCX/PDF in `src/lib/export.ts` is separate from backend export routes.

---

## 4. Analytics

| Endpoint     | Client | UI  |
| ------------ | ------ | --- |
| `GET /stats` | [ ]    | [ ] |

---

## 5. Projects (Bearer; `/{proj_id}` also accepts `x-api-key`)

| Endpoint                                   | Client | UI  |
| ------------------------------------------ | ------ | --- |
| `POST /projects/`                          | [ ]    | [ ] |
| `GET /projects/`                           | [ ]    | [ ] |
| `GET /projects/{proj_id}`                  | [ ]    | [ ] |
| `PATCH /projects/{proj_id}`                | [ ]    | [ ] |
| `DELETE /projects/{proj_id}`               | [ ]    | [ ] |
| `POST /projects/{proj_id}/keys`            | [ ]    | [ ] |
| `GET /projects/{proj_id}/keys`             | [ ]    | [ ] |
| `PATCH /projects/{proj_id}/keys/{key_id}`  | [ ]    | [ ] |
| `DELETE /projects/{proj_id}/keys/{key_id}` | [ ]    | [ ] |

---

## 6. Templates (all require Bearer)

| Endpoint                          | Client | UI  |
| --------------------------------- | ------ | --- |
| `POST /templates`                 | [ ]    | [ ] |
| `GET /templates`                  | [ ]    | [ ] |
| `GET /templates/{template_id}`    | [ ]    | [ ] |
| `PATCH /templates/{template_id}`  | [ ]    | [ ] |
| `DELETE /templates/{template_id}` | [ ]    | [ ] |

---

## 7. Webhooks (optional FE)

Receiver routes are public; only wire if the UI needs to call them.

| Endpoint                           | Client | UI  |
| ---------------------------------- | ------ | --- |
| `POST /webhooks/outline-approved`  | [ ]    | [ ] |
| `POST /webhooks/chapter-completed` | [ ]    | [ ] |

---

## 8. App hardening

- [x] Library route error state
- [~] Auth-aware header (login/register vs user menu)
- [x] Audit query invalidation after every mutation
- [x] User-scope `quill.recent-books` (or clear on logout)
- [x] Do not retry queries on `401`
- [ ] Lint / typecheck after each integration pass
