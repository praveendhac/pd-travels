# API Contract Spec — Trip Planner

## Conventions
<!-- Base URL, versioning strategy, auth header format, content type, naming conventions -->
- Base URL:
- Versioning:
- Auth:
- Content-Type:

## Common Response Envelope
<!-- Standard success/error shape used across endpoints -->
```json
{
  "data": {},
  "error": null
}
```

## Error Format
<!-- Standard error codes/shape -->
```json
{
  "data": null,
  "error": {
    "code": "",
    "message": ""
  }
}
```

## Endpoints

### [METHOD] /path
- **Description:**
- **Auth required:**
- **Request params/body:**
  ```json
  {}
  ```
- **Response (success):**
  ```json
  {}
  ```
- **Response (errors):**
  | Status | Code | Meaning |
  |---|---|---|
  | | | |

<!-- Duplicate the endpoint block above for each API operation -->

## Pagination
<!-- Strategy: offset, cursor, page size defaults/limits -->

## Rate Limiting
<!-- Limits, headers, retry behavior -->

## Webhooks (if any)
<!-- Events, payload shape, retry/signing -->

## Open Questions
-
