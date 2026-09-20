# Goal Spec — Trip Planner

> **Note:** This draft is reverse-engineered from decisions already made in `frontend-spec.md`, `backend-spec.md`, and `api-contract-spec.md` (trips, itinerary, collaborators/roles, budget tracking, places search). It has not been validated against real user input — please edit freely; everything here is a starting point, not a decision.

## Problem Statement
Planning a multi-day trip with other people today is scattered across chat threads, spreadsheets, and separate booking sites — there's no single place to decide where you're going, lay out a day-by-day plan, share it with the people coming, and track what's being spent. Trip Planner aims to be that single place.

## Target Users / Personas
- **Trip Organizer** — creates a trip, builds the itinerary, invites others, has full (`owner`) control including deleting the trip
- **Trip Collaborator** — invited to help plan (`editor` role): can add/edit itinerary items and expenses, but can't delete the trip or manage other collaborators
- **Trip Viewer** — invited with read-only (`viewer` role) access, e.g. a family member who wants visibility without editing rights

## Core Use Cases
<!-- Priority order — confirm/reorder -->
1. Create and manage a trip (name, dates, source, destination)
2. Build a day-by-day itinerary of timed activities
3. Invite collaborators to a trip with a specific role, and manage those roles
4. Log and track expenses against a trip, viewable as a per-category budget summary
5. Search/discover destinations and points of interest while planning an itinerary item

## Success Metrics
<!-- Placeholders — confirm real targets and timeframe -->
- % of newly created trips with at least one itinerary item added within 24 hours
- Average number of collaborators per trip (adoption of sharing)
- % of trips with at least one expense logged (adoption of budget tracking)
- Weekly active trip planners in the weeks leading up to a trip's start date

## Scope
### In Scope
- Trip creation, editing, deletion
- Day-by-day itinerary builder (add/edit/remove/reorder items)
- Collaboration with role-based permissions (owner/editor/viewer)
- Per-trip expense logging and budget summary
- Destination/POI search via a third-party places API
- Email + password authentication

### Out of Scope
- Booking or payment processing for flights/hotels/activities (no PCI scope)
- In-app real-time chat/messaging
- Native mobile apps (responsive web only)
- Offline support

## Non-Goals
- Not a booking engine — this plans travel, it doesn't sell it
- Not a general-purpose project management or group-chat tool

## Constraints & Assumptions
- Frontend on Vercel, backend on AWS (ECS/RDS) — already reflected in `frontend-spec.md`/`backend-spec.md`
- No budget, timeline, or team size has been specified yet — flagged below
- Built incrementally via spec-driven development, one vertical slice (auth → trips → itinerary → budget → places) at a time

## Open Questions
- Who is the actual target audience? This is for casual/leisure travelers, families, or business travel groups
- What's the real timeline/budget/team size for this project? Immediate, no budget
- Is this a personal/portfolio project, or is monetization or wider distribution in scope eventually? personal/portfolio project
- Confirm the success metrics above are the right ones to track, and whether there's a target timeframe (e.g. "by end of v1 beta")? Suddess metrics above are right
