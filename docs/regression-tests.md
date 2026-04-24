# Regression Test Suite

## Latest Results
Last run: 2026-04-24
Tests: 58 passing / 58 total
New bugs found: none

---

## Running the suite

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

---

## Spec

The tests were generated from the following spec. Update this section if scope changes.

### API route tests (integration tests against the actual route handlers)

- **GET /api/tasks** — returns tasks for authenticated user; returns 401 when unauthenticated; handles empty list
- **POST /api/tasks** — creates single task; creates batch array; assigns correct prepend order (minOrder − 1); returns 201
- **PATCH /api/tasks/[id]** — updates title, notes, state, list, pinned; setting state to `done` sets `completedAt`; clearing state from `done` clears `completedAt`; clearing notes with `null` persists correctly (the `undefined`-drop bug we fixed); moving `today → not_today` increments `blownUpCount`; moving `not_today → today` does not
- **DELETE /api/tasks/[id]** — removes task; returns 204; returns 401 when unauthenticated
- **POST /api/tasks/blowup** — moves all non-done Today tasks to Not Today; increments `blownUpCount`; leaves done Today tasks in place; leaves Not Today tasks unchanged
- **PATCH /api/tasks/[id] moveToTop** — moved task gets `order=0`; ALL other tasks in the same list get sequential orders 1,2,3… (not just the moved one); tasks in other lists are untouched; `list` field is unchanged; others are sorted by their existing order before reindexing (the storage-order bug we fixed); consecutive moves compose correctly
- **PATCH /api/tasks/[id] moveToBottom** — moved task gets `order=listSize−1`; all others get sequential orders 0,1,2…

### Business logic unit tests

- **sortTasks()** — done tasks sink to bottom regardless of order field; non-done sorted ascending by order; mixed lists handled correctly
- **Commentary selection** — excludes tasks with `state === 'done'`; excludes tasks with `pinned === true`; selects `Math.ceil(n/2)` of eligible tasks; returns empty array when all tasks are ineligible
- **Note clearing** — `notes: null` in PATCH body persists as `null` (not dropped by serializer)

### Auth

- All API routes return 401 when `getUserId()` returns null

### Mock strategy

- `@/lib/onejsonfile` — `readTasks` and `updateTasks` are vitest fns; `updateTasks` mock simulates read→mutate→write by calling the mutate function with a clone of the current doc and updating state in-place, so consecutive calls within a test compose correctly
- `@/lib/get-user-id` — `getUserId` returns a fixed `TEST_USER_ID` by default; returns `null` for auth tests
- Next.js route handlers are imported directly and called with `NextRequest` instances

---

## Coverage table

| File | Tests | Covers |
|---|---|---|
| `api.tasks.test.ts` | 10 | GET + POST (single & batch) |
| `api.tasks-id.test.ts` | 23 | PATCH (standard, moveToTop, moveToBottom) + DELETE |
| `api.blowup.test.ts` | 9 | Blow-up: non-done today→not_today, done tasks untouched |
| `sortTasks.test.ts` | 6 | Done tasks sink, non-done sorted by order |
| `commentary.test.ts` | 10 | selectHalf, done/pinned exclusion, notes: null roundtrip |

---

## Adding tests

Tests live in `src/__tests__/`. The shared helper and env setup are in:

- `src/__tests__/helpers.ts` — task factory, request builder
- `src/__tests__/setup.ts` — env vars required by route handlers

When a bug is fixed, add a regression test that would have caught it before marking the fix done. Update the **Latest Results** block after each run.
