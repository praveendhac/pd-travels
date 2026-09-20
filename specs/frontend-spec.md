# Frontend Spec — Trip Planner

## Tech Stack
- Framework: React 18 (Vite)
- Language: TypeScript
- Styling: Tailwind CSS
- State management: TanStack Query (server state/caching) + Zustand (small client-only UI state, e.g. modals, active tab, form drafts)
- Routing: React Router
- Build tool: Vite

## Pages / Routes
| Route | Purpose | Key Components |
|---|---|---|
| `/` | Landing/dashboard — list of the user's trips, entry point to create a new trip | `TripList`, `TripCard`, `CreateTripButton` |
| `/login`, `/signup` | Authentication | `AuthForm` |
| `/trips/:tripId` | Trip overview — dates, destinations, itinerary summary, collaborators | `TripHeader`, `ItineraryTimeline`, `CollaboratorList` |
| `/trips/:tripId/itinerary` | Day-by-day itinerary builder/editor | `DayColumn`, `ActivityCard`, `AddActivityModal` |
| `/trips/:tripId/budget` | Budget tracking for the trip | `BudgetSummary`, `ExpenseTable`, `AddExpenseForm` |
| `/explore` | Search/browse destinations, points of interest | `SearchBar`, `DestinationCard`, `FilterPanel` |
| `/profile` | User settings, account info | `ProfileForm`, `AccountSettings` |
| `/trips/:tripId/share` | Invite/manage collaborators | `InviteForm`, `PermissionsList` |

## Component Breakdown
- `TripCard` — summary card for a trip (dates, destination, thumbnail, progress)
- `ItineraryTimeline` — renders itinerary items chronologically, supports drag-to-reorder
- `ActivityCard` — a single itinerary item (place, time, notes, cost)
- `AddActivityModal` — form to add/edit an itinerary item, includes place search
- `BudgetSummary` — totals vs planned budget, per-category breakdown
- `SearchBar` — debounced input driving `/explore` results, backed by a places/destinations API
- `CollaboratorList` / `InviteForm` — manage who can view/edit a trip
- `AuthForm` — shared login/signup form component
- `Toast` / `LoadingSpinner` / `EmptyState` — shared feedback primitives used across pages

## UI/UX Requirements
- Fully responsive: mobile-first layout, usable on phone during travel and desktop while planning
- Accessible: semantic HTML, keyboard navigation, ARIA labels on interactive components, color contrast meeting WCAG AA
- Dark mode support (deferred — confirm priority)

### Design Tokens

**Typography:** Fira Sans, self-hosted via `@fontsource/fira-sans` (weights 400/500/600/700).
Fallback stack: `"Fira Sans", system-ui, -apple-system, sans-serif`

**Colors:**

| Token | Hex | Used for |
|---|---|---|
| `background` | `#FFFFFF` | Page base background |
| `surface` | `#F2E8DC` | Cards, panels, sections (light brown) |
| `surface-border` | `#E2D3BE` | Borders/dividers on surface elements |
| `primary` | `#16324F` | Buttons, links, active states, CTAs (dark blue — doubles as the accent color, no separate CTA color) |
| `primary-hover` | `#0E2338` | Hover/pressed state of primary |
| `text` | `#1C2B3A` | Body text (near-navy, softer than pure black) |
| `text-muted` | `#6B7280` | Secondary text, captions, placeholders |
| `success` | `#16A34A` | Confirmations (e.g. booking saved) |
| `warning` | `#D97706` | Warnings (e.g. over budget) |
| `error` | `#DC2626` | Form/validation errors, failed requests |

Semantic colors (success/warning/error) use standard, high-saturation values rather than palette-muted tones, so status signals stay unambiguous and don't get lost against the warm neutral background.

Tailwind theme extension:
```js
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      sans: ['"Fira Sans"', 'system-ui', '-apple-system', 'sans-serif'],
    },
    colors: {
      background: '#FFFFFF',
      surface: '#F2E8DC',
      'surface-border': '#E2D3BE',
      primary: { DEFAULT: '#16324F', hover: '#0E2338' },
      text: { DEFAULT: '#1C2B3A', muted: '#6B7280' },
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
    },
  },
},
```

### Layout & Visual Style Patterns

Reference: mood-board images provided by the user (generic UI/UX marketing graphics — style/structure reference only, not literal designs; their purple/pink/teal gradient colors are **not** used — see palette above).

- **Top navigation bar**: logo/wordmark on the left, primary nav links, a right-aligned account/CTA area — sticky on scroll
- **Hero sections**: large bold heading + short supporting text + one primary CTA button (pill or rounded-rect, `primary` color, white text)
- **Floating/layered cards**: content grouped into rounded-corner cards (`rounded-xl`, ~16px radius) with a soft drop shadow, sometimes overlapping/offset from each other to create visual depth (e.g. on the dashboard, `TripCard`s can overlap slightly on hover/stack)
- **Card anatomy**: icon or thumbnail + short label + supporting metadata line, matching the `TripCard`/`ActivityCard` pattern already in Component Breakdown
- **Decorative accents**: subtle background shapes (soft circles/blobs) used sparingly behind hero/empty-state illustrations for visual interest — kept low-contrast (`surface`/`surface-border` tones), not the saturated gradient blobs in the reference images
- **Consistent corner radius and shadow scale** applied via Tailwind's `rounded-xl`/`shadow-md` utilities so cards feel like one system across pages

## State & Data Flow
- **Server state** (trips, itinerary items, budget, user profile, search results): fetched and cached via TanStack Query; mutations use optimistic updates where latency matters (e.g. reordering itinerary items)
- **Client-only state** (modal visibility, active tab, unsaved form drafts): Zustand store, scoped per feature where possible
- API calls go through a single typed client module (generated from/validated against `api-contract-spec.md`) so request/response shapes stay in sync with the backend contract
- No prop-drilling for cross-cutting concerns (auth user, theme) — provided via React Context at the app root

## Authentication & Session Handling
- **Strategy (finalized in `backend-spec.md`):** JWT access token (~15 min) + httpOnly refresh token cookie (~30 days)
- Access token returned in the login/refresh response body, held in memory (not localStorage, to reduce XSS exposure), and sent as `Authorization: Bearer <token>` on each API request
- Frontend also keeps a TanStack Query `me` query to track the current user/auth status
- On access token expiry (401), the API client transparently calls `/auth/refresh` (using the httpOnly cookie) to get a new access token before retrying; if refresh also fails, triggers a global logout/redirect to `/login`
- Protected routes wrapped in a `<RequireAuth>` guard that redirects to `/login` if unauthenticated
- **Cross-origin note:** since the frontend is hosted on Vercel and the backend on Render (different domains), the refresh cookie requires `SameSite=None; Secure`, and the backend's CORS config must set `Access-Control-Allow-Credentials: true` with an explicit allowed-origin list (not `*`). Per `backend-spec.md`, Vercel preview deployments are **not** included in that allowlist — preview builds should point at a shared staging API instead.

## Error Handling & Loading States
- Loading: skeleton components for list/detail views instead of spinners where layout is known ahead of time
- Errors: inline field-level errors for forms; toast notifications for background mutation failures; a full-page error boundary for unrecoverable render errors
- Empty states: dedicated `EmptyState` component with a clear call-to-action (e.g. "No trips yet — create your first one")
- Network/API errors surfaced with retry affordance (TanStack Query's built-in retry + manual "Retry" button)

## Performance Requirements
- Initial bundle target: < 200KB gzipped for the main chunk
- Route-based code splitting via `React.lazy` for all non-landing routes
- Images (destination photos) lazy-loaded and served responsively (`srcset`)
- Largest Contentful Paint target: < 2.5s on 4G

## Testing Strategy
- Unit tests: Vitest for utility functions and hooks
- Component tests: React Testing Library for component behavior in isolation
- E2E tests: Playwright for critical flows (sign up, create trip, add itinerary item, invite collaborator)
- API layer mocked via MSW (Mock Service Worker) in component/unit tests

## Deployment & Hosting
- **Platform:** Vercel
- **Framework preset:** Vite (auto-detected); build command `vite build`, output directory `dist`
- **SPA routing:** since React Router handles routing client-side, add a `vercel.json` rewrite so direct navigation/refresh on routes like `/trips/:tripId` doesn't 404 against Vercel's static file server:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Environment variables:** any value the browser bundle needs (e.g. API base URL) must be prefixed `VITE_` (e.g. `VITE_API_BASE_URL`) to be exposed by Vite at build time — configured per environment (Production/Preview/Development) in the Vercel dashboard
- **Preview deployments:** Vercel builds a unique preview URL for every branch/PR automatically — use these for UI review before merging to `main`
- **HTTPS/CDN:** handled automatically by Vercel's edge network, no extra config needed
- **Image optimization:** Vercel's automatic image optimization (`next/image`) is Next.js-specific and not available here — responsive/lazy image handling (per Performance Requirements) must be done manually (native `loading="lazy"`, `srcset`)

## Open Questions
- Confirm core use cases and priority order once `goal-spec.md` is filled — routes/components above may need to change
- Is dark mode in scope for v1?
- Do we need offline support (e.g. viewing itinerary without connectivity while traveling)?
- Custom domain (e.g. `app.pdtravels.com`) vs default `*.vercel.app` subdomain — affects cookie `SameSite`/CORS setup (backend now confirmed on Render, so this is cross-domain regardless — see `backend-spec.md`)
- Is a staging backend environment needed so Vercel preview deployments have something to call?
