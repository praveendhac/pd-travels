# Backend Spec — Trip Planner

> **Note:** `goal-spec.md` is not yet filled in. The data model and services below are drafted to support the pages/components already defined in `frontend-spec.md` and should be revisited once personas/use cases are confirmed.

## Tech Stack
- Language: TypeScript
- Framework: Express
- Runtime: Node.js 20 LTS
- ORM: Prisma (assumed default — TypeScript-native, built-in migrations; flagged in Open Questions in case TypeORM/Knex is preferred instead)

## Architecture Overview
Single Express monolith exposing a REST API (per `api-contract-spec.md`), backed by PostgreSQL. No separate microservices at this stage — the domain (trips, itineraries, budgets, collaborators) is small enough that a modular monolith (one Express app, organized into per-domain modules/routers/services) is simpler to build and deploy than splitting into services prematurely.

```
Vercel (frontend) --HTTPS--> AWS ALB --> ECS/Fargate (Express API) --> RDS (PostgreSQL)
                                                    |
                                                    +--> Third-party APIs (Places/Maps)
                                                    +--> SES (email)
```

## Data Model
| Entity | Fields | Relationships |
|---|---|---|
| `User` | id, email, password_hash, name, created_at | has many `Trip` (as owner), has many `TripCollaborator` |
| `Trip` | id, owner_id, name, start_date, end_date, destination, cover_image_url, created_at | belongs to `User` (owner); has many `ItineraryItem`, `Expense`, `TripCollaborator` |
| `TripCollaborator` | id, trip_id, user_id, role (`owner` \| `editor` \| `viewer`), invited_at, accepted_at | belongs to `Trip` and `User` |
| `ItineraryItem` | id, trip_id, day_date, start_time, title, location, notes, cost, order_index | belongs to `Trip` |
| `Expense` | id, trip_id, itinerary_item_id (nullable), category, amount, currency, note, created_by | belongs to `Trip`, optionally to `ItineraryItem` |
| `Place` (cache) | id, external_id, name, lat, lng, category, raw_json | referenced by `ItineraryItem` (optional, for search result caching) |

## Database
- Database: PostgreSQL 16 (managed via AWS RDS)
- ORM/Query layer: Prisma
- Migrations: Prisma Migrate, run as an explicit step in CI/CD before deploying the new app version (never auto-migrate on app boot in production)

## Business Logic / Core Services
- `AuthService` — signup, login, token issuance/refresh, password hashing (argon2)
- `TripService` — CRUD for trips, ownership checks
- `ItineraryService` — CRUD + reordering for itinerary items within a trip
- `BudgetService` — expense CRUD, per-trip/per-category totals
- `CollaboratorService` — invite/accept/remove collaborators, role enforcement
- `PlacesService` — wraps the third-party places/maps API for `/explore` search, with local caching in `Place`

## Authentication & Authorization
- **Strategy:** JWT — short-lived access token (~15 min) + long-lived refresh token (~30 days)
- Access token returned in the login/refresh response body; held in memory on the frontend and sent as `Authorization: Bearer <token>` on each request (matches `frontend-spec.md`'s in-memory auth state)
- Refresh token set as an **httpOnly, Secure cookie**, used only against a `/auth/refresh` endpoint
- **Cross-origin requirement:** frontend (Vercel) and backend (AWS) are on different domains, so the refresh cookie needs `SameSite=None; Secure`, and CORS must be configured with `Access-Control-Allow-Credentials: true` plus an explicit allowed-origin list (see Security Considerations) — this resolves the open question left in `frontend-spec.md`
- **Authorization:** role-based per trip via `TripCollaborator.role` (`owner` > `editor` > `viewer`); middleware checks the caller's role against the trip before mutating endpoints

## Third-Party Integrations
| Service | Purpose | Notes |
|---|---|---|
| Places/Maps API (e.g. Google Places or Mapbox) | Destination/POI search for `/explore`, autocomplete for itinerary item locations | Choice not yet finalized — see Open Questions |
| Amazon SES | Transactional email (collaborator invites, password reset) | Natural fit since backend is already on AWS |

## Background Jobs / Async Processing
- None required for v1 — collaborator invite emails and other notifications sent synchronously within the request
- Revisit with a queue (e.g. BullMQ + Redis/SQS) if email sending or place-search caching needs to move off the request path

## Infrastructure & Deployment
- **Compute:** AWS ECS on Fargate running the Express app as a Docker container, behind an Application Load Balancer
- **Database:** AWS RDS for PostgreSQL, private subnet, only reachable from the ECS service
- **Container registry:** AWS ECR
- **CI/CD:** GitHub Actions — on merge to `main`, build Docker image → push to ECR → run Prisma migrations → deploy new ECS task definition
- **Environments:** dev, staging, prod — separate ECS services/RDS instances (or at minimum separate databases) per environment
- **Secrets:** AWS Secrets Manager (DB credentials, JWT signing keys, third-party API keys), injected into ECS task definitions as environment variables
- **Domain/HTTPS:** Route 53 + ACM certificate on the ALB; see Open Questions on whether frontend/backend share a parent domain

## Logging, Monitoring & Observability
- Structured JSON logs (e.g. via `pino`) shipped to CloudWatch Logs
- CloudWatch Alarms on 5xx rate, latency (p95), and ECS task health
- Error tracking via Sentry (or similar) for unhandled exceptions with request context
- Request logging includes a correlation/request ID propagated from the frontend for tracing a single user action end-to-end

## Security Considerations
- Input validation on every endpoint via a schema library (e.g. `zod`), matching the shapes defined in `api-contract-spec.md`
- Password hashing with argon2 (never store plaintext or reversible-encrypted passwords)
- `helmet` middleware for standard HTTP security headers
- Explicit CORS allowlist: production Vercel domain (or custom domain) + backend's own health-check origin; **Vercel preview deployment URLs are per-branch/dynamic, so credentialed CORS cannot safely wildcard `*.vercel.app`** — preview builds should point at a shared staging API instead of assuming CORS access to production
- Rate limiting on auth endpoints (`/auth/login`, `/auth/signup`) to slow brute-force attempts
- Parameterized queries via Prisma (no raw SQL string concatenation) to prevent SQL injection
- JWT signing secret stored in Secrets Manager, rotated periodically

## Testing Strategy
- Unit tests: Jest, for services and business logic in isolation (mocked Prisma client)
- Integration tests: Jest + a real Postgres instance (via Testcontainers or a Dockerized test DB) exercising actual routes end-to-end
- Contract tests: request/response shapes validated against the schemas defined in `api-contract-spec.md`
- Run in CI on every PR before merge is allowed

## Open Questions
- Confirm entities/relationships once `goal-spec.md` defines the actual use cases — data model above is a draft
- ORM choice: Prisma assumed — confirm, or switch to TypeORM/Knex
- Places/Maps provider: Google Places vs Mapbox vs other — affects pricing and third-party integration details
- Custom domain decision (tracked in `frontend-spec.md`) — if frontend and backend can share a parent domain (e.g. `app.pdtravels.com` / `api.pdtravels.com`), the refresh cookie could use `SameSite=Lax` instead of `SameSite=None`, simplifying the cross-origin auth setup
- Do we need a staging environment accessible to Vercel preview deployments, and if so, how is it kept in sync with prod schema?
- Any payment/booking functionality planned (would introduce PCI-scope considerations)?
