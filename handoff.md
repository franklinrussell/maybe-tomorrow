# Maybe Tomorrow — Handoff

A two-list task manager. Tasks live in Today or Not Today. The main interaction is deciding what you're actually doing versus what can wait.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.3, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth.js v5 beta (`next-auth@5.0.0-beta.30`) |
| Database | onejsonfile.com (one JSON file per collection) |
| Drag & drop | @hello-pangea/dnd |
| Animations | Framer Motion |
| Email | Resend (support form + magic link auth via SMTP) |
| Email templates | @react-email/components |
| AI | Anthropic Claude API (stubbed, not yet surfaced in UI) |
| Fonts | Bebas Neue (`--font-bebas`) · Plus Jakarta Sans (`--font-jakarta`) |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Environment variables

See `.env.production.example` for the full list. Key ones:

```
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GITHUB_ID / GITHUB_SECRET
EMAIL_SERVER          # smtp://resend:RESEND_API_KEY@smtp.resend.com:587
EMAIL_FROM            # must be a verified Resend sender domain
ONEJSONFILE_USERS_TOKEN
ONEJSONFILE_TASKS_TOKEN
ONEJSONFILE_SESSIONS_TOKEN
ONEJSONFILE_AUTH_TOKEN
ANTHROPIC_API_KEY
RESEND_API_KEY        # used by the support contact form
```

---

## Data model

```ts
interface Task {
  id: string
  userId: string
  title: string
  notes?: string
  state: 'not_started' | 'in_progress' | 'done'
  list: 'today' | 'not_today'
  order: number          // lower = higher on screen
  blownUpCount: number   // incremented each time swept via blow-up
  pinned?: boolean       // Not Today only — copy-on-move behaviour
  createdAt: string
  updatedAt: string
  completedAt?: string   // set when state → done, cleared on undo
}
```

Four onejsonfile collections, each with its own token:
- **users** — `{ [userId]: User }`
- **tasks** — `{ [userId]: Task[] }`
- **sessions** — `{ [sessionToken]: { userId, expires } }`
- **authMeta** — OAuth accounts + email verification tokens

All writes go through `updateTasks(mutate)` (read → mutate → write) in `src/lib/onejsonfile.ts`. No true concurrency protection — fine for current scale.

---

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page; shows app CTA if authed |
| `/tasks` | `src/app/tasks/page.tsx` | Main board — requires auth (middleware-protected) |
| `/login` | `src/app/login/page.tsx` | Google, GitHub, email magic link |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy |
| `/terms` | `src/app/terms/page.tsx` | Terms of service |
| `/support` | `src/app/support/page.tsx` | Contact form (session email pre-filled, logged-in only link in footer) |

---

## API routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/tasks` | GET, POST | Fetch all tasks; create one or batch (array body) |
| `/api/tasks/[id]` | PATCH, DELETE | Update (state, list, order, title, notes, pinned, moveToTop) or delete |
| `/api/tasks/blowup` | POST | Move all non-done Today tasks to top of Not Today, increment blownUpCount |
| `/api/ai/suggest` | POST | Claude suggestions (stubbed) |
| `/api/support` | POST | Contact form → branded HTML emails via Resend |
| `/api/auth/[...nextauth]` | * | NextAuth handler |

### POST /api/tasks batch import
Accepts either `{ title, list, ... }` (single) or an array. Array path creates all tasks in one onejsonfile read→mutate→write, returns `{ tasks: Task[] }`.

### POST /api/support
Validates fields, rate-limits by email (60s in-memory), then sends two emails in parallel via Resend:
- **SupportNotification** → `fjr@fjr.com`, `replyTo` set to submitter, HTML template
- **SupportAutoReply** → submitter's email, branded HTML template

---

## Email templates (`src/emails/`)

Both use `@react-email/components`, rendered via `render()` before passing to Resend.

| File | Recipient | Purpose |
|---|---|---|
| `SupportNotification.tsx` | fjr@fjr.com | Internal alert with all fields; reply-to set to submitter |
| `SupportAutoReply.tsx` | Submitter | Branded confirmation; "We'll respond maybe tomorrow." |

Both share the same visual style: `#1a1a1a` black header, `#FFE500` yellow `→ MAYBE TOMORROW` wordmark, `#f4f4f5` message preview box.

---

## Component map

```
Header.tsx          — sticky top bar: logo, theme toggle, user avatar dropdown
                      owns isImportOpen state, renders ImportModal
Footer.tsx          — client component; logo + Privacy / Terms / Support links
                      Support link only shown when session exists (useSession)
ImportModal.tsx     — batch import overlay (backdrop flex-centers the modal)
TaskList.tsx        — Today or Not Today column; owns DoneDrawer state
TaskCard.tsx        — individual task: state toggle, inline edit, pin, move, delete
                      age indicator (blue dashes), blow-up count (red dashes)
BlowUpButton.tsx    — two-stage sweep button in Today column footer
DoneDrawer.tsx      — slide-up sheet of tasks completed on previous days
AddTaskInput.tsx    — inline add form at column footer
StateToggle.tsx     — cycles not_started → in_progress → done
Logo.tsx            — SVG arrow mark
```

---

## Key behaviours

### Task ordering
`order` is a float-ish integer. New tasks get `minOrder - 1` (prepend). Drag reorder assigns `0, 1, 2…` to the affected list. `sortTasks()` in TaskList.tsx sorts by `order` with done tasks always sinking to the bottom.

### Done tasks / Done drawer
Tasks completed **today** remain visible in the active column (strikethrough, faded, at bottom). Tasks completed on **any previous day** are hidden from the active column and accessible via the "N ✓" button in the Today footer → DoneDrawer. The counter uses a subtraction approach immune to date edge cases:

```ts
const activeDoneIds = new Set(tasks.filter(t => t.state === 'done').map(t => t.id))
const drawerTasks = allTasks.filter(t => t.state === 'done' && !activeDoneIds.has(t.id))
```

`completedAt` is set optimistically on the client and persisted via PATCH. A backfill migration in `GET /api/tasks` caps old done tasks' `completedAt` at end-of-yesterday so they always land in the drawer rather than the active column.

### Pinned Not Today tasks
`pinned: true` on a Not Today task changes the arrow button behaviour: instead of moving the task, it **copies** it to Today (new UUID, POST /api/tasks) and leaves the original in Not Today unchanged. Useful for recurring items.

### Blow-up / sweep
BlowUpButton is two-stage (click once to arm, click again to fire). On fire:
1. Cards animate: shake → fly off screen to the right (staggered 80ms each)
2. Wait for all animations to complete
3. Move all non-done Today tasks to top of Not Today, increment blownUpCount
4. Flash the Not Today column header
5. PATCH via `/api/tasks/blowup`

### Import
ImportModal (opened from avatar dropdown → "Import tasks") accepts a textarea of one-per-line task names, a Today/Not Today destination toggle, and submits as a batch POST. Optimistic UI adds tasks immediately; server response reconciles IDs.

### Inline editing
Click a task title to enter edit mode. Saves on Enter, click outside, or focus leaving the card. Escape cancels. Action buttons are hidden while editing.

---

## Auth

NextAuth v5 with a custom `OnejsonfileAdapter` (stored in `src/lib/auth.ts`). Providers: Google, GitHub, email magic link via Resend SMTP. `DEV_USER` / `DEV_USER_ID` constants exist in `src/lib/dev-user.ts` and are threaded through the app-level `apiFetch` as an `x-user-id` header — this is a dev shortcut; production auth uses the session via `getUserId()` in API routes.

The middleware (`src/middleware.ts`) protects `/tasks/:path*` — unauthenticated requests redirect to `/login`. The landing page wraps `auth()` in `.catch(() => null)` so a transient onejsonfile timeout doesn't crash it.

---

## Known rough edges

- **No real concurrency protection** on onejsonfile writes. Two simultaneous requests can clobber each other. Acceptable for single-user beta.
- **In-memory rate limiting** on `/api/support` resets on server restart / cold starts. Fine for now.
- **`DEV_USER_ID` header** in AppPage's `apiFetch` is a leftover dev shortcut. API routes use `getUserId()` which reads the real session — the header is ignored in production if `getUserId()` succeeds.
- **AI suggest** route exists but is not wired to any UI yet.
- **No account deletion flow** — documented in privacy policy as "contact us."
- **Middleware deprecation warning** — Next.js 16 prefers `proxy` over `middleware` file convention. Functional but will need renaming eventually.

---

## Deployment

Vercel. Push to `main` → auto-deploy. Make sure all env vars from `.env.production.example` are set in the Vercel dashboard.

The `noreply@onejsonfile.com` sender domain must be verified in Resend for both the support form emails and the magic link auth emails to deliver.
