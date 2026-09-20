# API Contract Spec — Trip Planner

## Conventions
- **Base URL:** `https://api.pdtravels.com/v1` (exact domain pending the custom-domain decision tracked in `frontend-spec.md`/`backend-spec.md`)
- **Versioning:** URL path prefix (`/v1`); breaking changes ship as `/v2`, old versions supported for a deprecation window
- **Auth:** `Authorization: Bearer <access_token>` header on all endpoints except `/auth/signup`, `/auth/login`, `/auth/refresh`. Refresh token is a separate httpOnly cookie, never sent in the body (see `backend-spec.md` Authentication section)
- **Content-Type:** `application/json` for all requests and responses
- **Naming:** resource paths are plural nouns (`/trips`, `/trips/:tripId/itinerary`); fields are `camelCase`; timestamps are ISO 8601 UTC strings

## Common Response Envelope
```json
{
  "data": {},
  "error": null
}
```

## Error Format
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "startDate must be before endDate"
  }
}
```

**Standard error codes:**
| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/params failed schema validation |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired access token |
| `FORBIDDEN` | 403 | Authenticated, but caller's role doesn't permit this action |
| `NOT_FOUND` | 404 | Resource doesn't exist or caller has no access to it |
| `CONFLICT` | 409 | State conflict (e.g. email already registered, duplicate invite) |
| `RATE_LIMITED` | 429 | Too many requests — see Rate Limiting |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

## Endpoints

### Auth

#### POST /auth/signup
- **Description:** Create a new user account
- **Auth required:** No
- **Request params/body:**
  ```json
  { "email": "jane@example.com", "password": "********", "name": "Jane Doe" }
  ```
- **Response (success):**
  ```json
  {
    "data": {
      "accessToken": "eyJ...",
      "user": { "id": "usr_1", "email": "jane@example.com", "name": "Jane Doe", "createdAt": "2026-09-21T00:00:00Z" }
    },
    "error": null
  }
  ```
  Refresh token is set via `Set-Cookie` (httpOnly, `SameSite=None`, `Secure`), not in the body.
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Missing/invalid email or password too short |
  | 409 | `CONFLICT` | Email already registered |

#### POST /auth/login
- **Description:** Authenticate with email/password
- **Auth required:** No
- **Request params/body:**
  ```json
  { "email": "jane@example.com", "password": "********" }
  ```
- **Response (success):** same shape as `/auth/signup`
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Missing email or password |
  | 401 | `UNAUTHORIZED` | Incorrect email or password |

#### POST /auth/refresh
- **Description:** Exchange a valid refresh cookie for a new access token
- **Auth required:** No (relies on the httpOnly refresh cookie instead)
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "accessToken": "eyJ..." }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 401 | `UNAUTHORIZED` | Refresh cookie missing, invalid, or expired — frontend should redirect to `/login` |

#### POST /auth/logout
- **Description:** Invalidate the current refresh token and clear the cookie
- **Auth required:** Yes
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "success": true }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 401 | `UNAUTHORIZED` | Not authenticated |

#### GET /auth/me
- **Description:** Get the currently authenticated user
- **Auth required:** Yes
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "id": "usr_1", "email": "jane@example.com", "name": "Jane Doe", "createdAt": "2026-09-21T00:00:00Z" }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 401 | `UNAUTHORIZED` | Not authenticated |

### Trips

#### GET /trips
- **Description:** List trips the caller owns or collaborates on
- **Auth required:** Yes
- **Request params/body:** query params `limit` (default 20, max 100), `offset` (default 0)
- **Response (success):**
  ```json
  {
    "data": {
      "items": [
        { "id": "trip_1", "name": "Japan 2026", "startDate": "2026-11-01", "endDate": "2026-11-14", "source": "San Francisco", "destination": "Japan", "coverImageUrl": null, "role": "owner" }
      ],
      "total": 1
    },
    "error": null
  }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 401 | `UNAUTHORIZED` | Not authenticated |

#### POST /trips
- **Description:** Create a new trip (caller becomes owner)
- **Auth required:** Yes
- **Request params/body:**
  ```json
  { "name": "Japan 2026", "startDate": "2026-11-01", "endDate": "2026-11-14", "source": "San Francisco", "destination": "Japan" }
  ```
- **Response (success):**
  ```json
  { "data": { "id": "trip_1", "name": "Japan 2026", "startDate": "2026-11-01", "endDate": "2026-11-14", "source": "San Francisco", "destination": "Japan", "coverImageUrl": null, "role": "owner" }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Missing name, or `endDate` before `startDate` |
  | 401 | `UNAUTHORIZED` | Not authenticated |

#### GET /trips/:tripId
- **Description:** Get a single trip's details
- **Auth required:** Yes (must be owner or collaborator)
- **Request params/body:** none
- **Response (success):** same shape as a single item from `GET /trips`
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 401 | `UNAUTHORIZED` | Not authenticated |
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### PATCH /trips/:tripId
- **Description:** Update trip fields
- **Auth required:** Yes (`owner` or `editor` role)
- **Request params/body:** any subset of `{ name, startDate, endDate, source, destination, coverImageUrl }`
- **Response (success):** updated trip object
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Invalid field values |
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### DELETE /trips/:tripId
- **Description:** Delete a trip and its itinerary/expenses/collaborators
- **Auth required:** Yes (`owner` role only)
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "success": true }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller is not the owner |
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

### Collaborators

#### GET /trips/:tripId/collaborators
- **Description:** List a trip's collaborators
- **Auth required:** Yes (must have access to the trip)
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "items": [ { "id": "collab_1", "userId": "usr_2", "email": "sam@example.com", "name": "Sam", "role": "editor", "invitedAt": "2026-09-20T00:00:00Z", "acceptedAt": null } ] }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### POST /trips/:tripId/collaborators
- **Description:** Invite a collaborator by email
- **Auth required:** Yes (`owner` role only)
- **Request params/body:**
  ```json
  { "email": "sam@example.com", "role": "editor" }
  ```
- **Response (success):** created collaborator object (see above), `acceptedAt: null` until they accept
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Invalid email or role |
  | 403 | `FORBIDDEN` | Caller is not the owner |
  | 409 | `CONFLICT` | This email is already a collaborator on the trip |

#### PATCH /trips/:tripId/collaborators/:collaboratorId
- **Description:** Change a collaborator's role, or accept an invite (self-service, called by the invited user)
- **Auth required:** Yes (`owner` to change role; the invited user themself to accept)
- **Request params/body:** `{ "role": "viewer" }` or `{ "accepted": true }`
- **Response (success):** updated collaborator object
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller is neither the owner nor the invited user |
  | 404 | `NOT_FOUND` | Collaborator record doesn't exist |

#### DELETE /trips/:tripId/collaborators/:collaboratorId
- **Description:** Remove a collaborator from a trip
- **Auth required:** Yes (`owner` role, or the collaborator removing themself)
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "success": true }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller lacks permission |
  | 404 | `NOT_FOUND` | Collaborator record doesn't exist |

### Itinerary

#### GET /trips/:tripId/itinerary
- **Description:** List itinerary items for a trip, ordered by day then `orderIndex`
- **Auth required:** Yes (must have access to the trip)
- **Request params/body:** none
- **Response (success):**
  ```json
  {
    "data": {
      "items": [
        { "id": "item_1", "dayDate": "2026-11-01", "startTime": "09:00", "title": "Senso-ji Temple", "location": "Asakusa, Tokyo", "notes": null, "cost": 0, "orderIndex": 0 }
      ]
    },
    "error": null
  }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### POST /trips/:tripId/itinerary
- **Description:** Add an itinerary item
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:**
  ```json
  { "dayDate": "2026-11-01", "startTime": "09:00", "title": "Senso-ji Temple", "location": "Asakusa, Tokyo", "notes": null, "cost": 0 }
  ```
- **Response (success):** created itinerary item (server assigns `id` and `orderIndex`, appended to the end of that day)
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Missing title, or `dayDate` outside the trip's date range |
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### PATCH /trips/:tripId/itinerary/:itemId
- **Description:** Update an itinerary item's fields
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:** any subset of the item fields
- **Response (success):** updated itinerary item
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Item doesn't exist |

#### DELETE /trips/:tripId/itinerary/:itemId
- **Description:** Remove an itinerary item
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "success": true }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Item doesn't exist |

#### PATCH /trips/:tripId/itinerary/reorder
- **Description:** Bulk-update `orderIndex` (and optionally `dayDate`, for cross-day drag) after a drag-and-reorder in `ItineraryTimeline`
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:**
  ```json
  { "items": [ { "id": "item_1", "dayDate": "2026-11-01", "orderIndex": 0 }, { "id": "item_2", "dayDate": "2026-11-01", "orderIndex": 1 } ] }
  ```
- **Response (success):**
  ```json
  { "data": { "success": true }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | An item id doesn't belong to this trip |
  | 403 | `FORBIDDEN` | Caller has `viewer` role |

### Budget / Expenses

#### GET /trips/:tripId/expenses
- **Description:** List expenses for a trip
- **Auth required:** Yes (must have access to the trip)
- **Request params/body:** none
- **Response (success):**
  ```json
  {
    "data": {
      "items": [
        { "id": "exp_1", "itineraryItemId": null, "category": "lodging", "amount": 12000, "currency": "JPY", "note": "Hotel deposit", "createdBy": "usr_1", "createdAt": "2026-09-20T00:00:00Z" }
      ]
    },
    "error": null
  }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### POST /trips/:tripId/expenses
- **Description:** Log an expense against a trip (optionally tied to an itinerary item)
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:**
  ```json
  { "itineraryItemId": null, "category": "lodging", "amount": 12000, "currency": "JPY", "note": "Hotel deposit" }
  ```
- **Response (success):** created expense object
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Missing/negative amount, or invalid currency code |
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

#### PATCH /trips/:tripId/expenses/:expenseId
- **Description:** Update an expense
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:** any subset of expense fields
- **Response (success):** updated expense object
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Expense doesn't exist |

#### DELETE /trips/:tripId/expenses/:expenseId
- **Description:** Remove an expense
- **Auth required:** Yes (`owner` or `editor`)
- **Request params/body:** none
- **Response (success):**
  ```json
  { "data": { "success": true }, "error": null }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 403 | `FORBIDDEN` | Caller has `viewer` role |
  | 404 | `NOT_FOUND` | Expense doesn't exist |

#### GET /trips/:tripId/budget/summary
- **Description:** Aggregate spend for `BudgetSummary` — total and per-category
- **Auth required:** Yes (must have access to the trip)
- **Request params/body:** none
- **Response (success):**
  ```json
  {
    "data": {
      "currency": "JPY",
      "totalSpent": 45000,
      "byCategory": [ { "category": "lodging", "amount": 12000 }, { "category": "food", "amount": 20000 } ]
    },
    "error": null
  }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 404 | `NOT_FOUND` | Trip doesn't exist or caller has no access |

### Explore / Places

#### GET /places/search
- **Description:** Search destinations/points of interest, backing `SearchBar`/`/explore` and location autocomplete on itinerary items. Proxies and caches results from the third-party Places/Maps provider (TBD in `backend-spec.md`)
- **Auth required:** Yes
- **Request params/body:** query params `q` (search text, required), `limit` (default 10, max 25)
- **Response (success):**
  ```json
  {
    "data": {
      "items": [ { "id": "place_1", "name": "Senso-ji Temple", "address": "2 Chome-3-1 Asakusa, Tokyo", "lat": 35.7148, "lng": 139.7967, "category": "landmark" } ]
    },
    "error": null
  }
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | 400 | `VALIDATION_ERROR` | Missing `q` |
  | 429 | `RATE_LIMITED` | Too many search requests |

## Pagination
- Offset-based for list endpoints (`GET /trips`): `limit` (default 20, max 100) + `offset` query params, response includes `total`
- Itinerary/expense/collaborator lists are not paginated — bounded by a single trip's data, expected to stay small
- `/places/search` uses `limit` only (no offset) since it's a live third-party search, not a stored collection

## Rate Limiting
- `/auth/login` and `/auth/signup`: 10 requests/minute per IP, to slow brute-force attempts
- `/places/search`: 30 requests/minute per user, since each call proxies a billed third-party API
- All other endpoints: 300 requests/minute per user
- Rate-limited responses include `Retry-After` header (seconds) and use the `RATE_LIMITED` error code

## Webhooks (if any)
- None planned for v1 (no payment/booking provider integrated yet — see Open Questions in `backend-spec.md`)

## Open Questions
- Finalize entities/endpoints once `goal-spec.md` defines confirmed use cases
- Should `GET /trips` distinguish "owned" vs "shared with me" trips, or is a single combined list with a `role` field sufficient?
- Do itinerary items need per-item currency, or one currency per trip (current assumption)?
- Exact shape of third-party Places response once a provider (Google Places vs Mapbox) is chosen — `/places/search` response fields above are a best guess
- Should collaborator invites be accepted via a signed link (email) in addition to the in-app `PATCH .../collaborators/:id` accept action, for inviting someone without an existing account?
