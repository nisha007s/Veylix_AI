# Veylix AI — API Specification v0.1

Status: **Working draft** (resolves OD-27). Authority: PRD v1.2 prevails; SRS v1.1 / SAD v1.1 are references.
Scope: MVP endpoints only. Items marked *(Phase n)* are built in that phase.

## 1. Conventions

- Base path: `/api/v1`. JSON request/response bodies, except PDF/CSV downloads.
- Scan input is sent only in POST bodies, never in query strings.
- Every response has an `X-Request-ID` header.
- Scan, history, report and account responses send `Cache-Control: no-store`.
- Scan request bodies are limited to **128 KB** (checked before the body is parsed).
- Unknown JSON fields are ignored.
- Record IDs are UUIDs. A malformed, unknown or another user's ID returns **404** `not_found`.
- URLs in responses are always **defanged display strings**; raw URLs and raw email text are never returned.
- Ordinary users never see raw model scores or percentages.
- Authenticated POST/PATCH/DELETE requests require a CSRF token header (mechanism decided with sessions, OD-17, Phase 4).

## 2. Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "URL is longer than 2,048 characters.",
    "request_id": "6f1c…",
    "fields": [{ "field": "url", "reason": "too_long" }]
  }
}
```

`fields` appears only for validation errors and never contains the submitted value.
`reason` is one of: `required`, `empty`, `too_long`, `too_short`, `unparseable`, `invalid_value`.

| HTTP | `code` | When |
|---|---|---|
| 422 | `validation_error` | Invalid input (never returned as Inconclusive) |
| 401 | `authentication_required` | No valid session, including a stale/expired session cookie |
| 401 | `invalid_credentials` | Any failed login (same message for unknown email and wrong password) |
| 403 | `forbidden` | Authenticated but wrong role |
| 403 | `csrf_failed` | Missing/invalid CSRF token |
| 403 | `self_approval_forbidden` | Admin approving own Analyst request (audited) |
| 404 | `not_found` | Missing, malformed or foreign record ID |
| 409 | `conflict` | Analyst request already pending or already decided |
| 413 | `payload_too_large` | Request body above 128 KB |
| 429 | `rate_limited` | Rate limit exceeded; `Retry-After` header included |
| 503 | `service_unavailable` | Database unavailable; a scan is never reported as saved |
| 500 | `internal_error` | Unexpected error; generic message only |

A missing or failed ML model is **not** an error: the scan returns 200 with `analysis_mode: "rules_only"`.

## 3. Scan endpoints *(Phase 2)*

Same endpoints for Guests and logged-in users. Results are saved only for logged-in users.
Successful scans return **200** for both. A request with a stale session cookie returns 401 (it is not silently treated as a Guest scan).

### 3.1 `POST /api/v1/scans/url`

Request: `{ "url": "string" }`

Validation, in order:

| Check | Failure |
|---|---|
| Body ≤ 128 KB | 413 |
| `url` present and a string | 422 `required` / `invalid_value` |
| Not empty / whitespace-only | 422 `empty` |
| Length ≤ 2,048 characters (before parsing) | 422 `too_long` |
| Parseable as a URL | 422 `unparseable` |

Response 200:

```json
{
  "scan_id": null,
  "saved": false,
  "input_type": "url",
  "display_value": "hxxps://secure-login[.]example[.]com/verify",
  "category": "medium",
  "category_label": "Medium",
  "category_meaning": "Some suspicious indicators exist.",
  "suggested_action": "Verify the sender/domain through an official channel before taking action.",
  "analysis_mode": "rules_only",
  "rule_evidence": [
    { "rule_id": "BR-009", "title": "Suspicious terms", "explanation": "…", "strength": "moderate" }
  ],
  "model_contributions": [],
  "limitations": ["This URL was not visited. Its page content and final destination are unknown."],
  "normalizations": ["scheme_added"],
  "notices": ["not_saved", "query_string_hidden"],
  "versions": { "rule_version": "0.1.0", "model_version": null },
  "analysed_at": "2026-11-08T10:00:00Z"
}
```

| Field | Values / notes |
|---|---|
| `scan_id`, `saved` | `null` / `false` for Guests; UUID / `true` when saved |
| `category` | `low` \| `medium` \| `high` \| `inconclusive` |
| `analysis_mode` | `rules_only` \| `hybrid` |
| `display_value` | Defanged; query string and fragment removed (final format OD-23, Phase 4) |
| `rule_evidence[].strength` | Labels defined in the rule catalogue (OD-03) |
| `model_contributions[]` | `{ "feature", "label", "direction" }` — names only, no numbers; empty in rules-only mode |
| `normalizations` | e.g. `scheme_added`, `defang_reversed` |
| `notices` | e.g. `not_saved`, `query_string_hidden`, `shortener_destination_unknown` |

### 3.2 `POST /api/v1/scans/email`

Request: `{ "text": "string" }` — HTML is detected and converted to plain text automatically.

Validation: same as 3.1, with a maximum of **50,000 characters** and no URL parsing step.

Response 200: same fields as 3.1, with `"input_type": "email"` and a fixed `display_value` (`"Pasted email (content not stored)"`), plus:

```json
"embedded_urls": {
  "found": 25, "analysed": 20, "not_analysed": 5, "failed": 0,
  "findings": [
    { "display_value": "hxxp://203[.]0[.]113[.]5/login", "category": "high", "rule_ids": ["BR-001", "BR-009"] }
  ]
},
"language": { "status": "english" }
```

- Links are taken from the visible text and, for pasted HTML, from `href` targets (which can hide the real destination). Duplicates count once.
- At most 20 unique embedded URLs are analysed, in order of appearance.
- `language.status`: `english` \| `mostly_non_english` \| `not_checked` (method OD-10, Phase 3).
- `normalizations` may include `html_converted`.
- Raw email text is never returned, stored or logged.

## 4. Other MVP endpoints

| Method + path | Who | Success | Notes |
|---|---|---|---|
| `GET /health` *(2)* | Anyone | 200 `{"status":"ok"}` | No configuration or model details |
| `POST /auth/register` *(4)* | Guest | 202 generic message | `{email, password}`; password ≥ 12 chars; duplicate email gets the same 202, no second account |
| `POST /auth/login` *(4)* | Guest | 200 | 401 `invalid_credentials`; 429 |
| `POST /auth/logout` *(4)* | User | 204 | Session no longer usable |
| `GET /auth/me` *(4)* | User | 200 `{id, email, role}` | Used by the frontend session state |
| `DELETE /users/me` *(4–5)* | User | 204 | Hard-deletes account, scans, indicators, requests |
| `GET /scans` *(4)* | User | 200 `{items, page, page_size, total}` | Filters `input_type`, `category`; `page_size` 1–100, default 20; newest first |
| `GET /scans/{id}` *(4)* | Owner | 200 | 404 otherwise |
| `DELETE /scans/{id}` *(4)* | Owner | 204 | Hard delete with indicators |
| `GET /dashboard` *(4)* | User | 200 | Totals, by type, by category, recent scans |
| `GET /scans/{id}/report.pdf` *(5)* | Owner | 200 file | `Content-Disposition: attachment`; not stored |
| `GET /scans/{id}/report.csv` *(5)* | Owner | 200 file | Formula-escaped, defanged |
| `GET /scans/{id}/technical` *(6)* | Analyst, own scans | 200 | Contents deferred (F1, Phase 6) |
| `POST /analyst-requests/me` *(6)* | Registered User | 201 | 409 if one is already pending |
| `GET /analyst-requests/me` *(6)* | User | 200 | Own request status |
| `GET /admin/analyst-requests` *(6)* | Admin | 200 | Filter `status` |
| `POST /admin/analyst-requests/{id}/approve` *(6)* | Admin | 200 | Own request → 403 `self_approval_forbidden` (audited); decided → 409 |
| `POST /admin/analyst-requests/{id}/reject` *(6)* | Admin | 200 | Decided → 409 |
| `GET /admin/users` *(6)* | Admin | 200 | Paginated; no scan content |
| `PATCH /admin/users/{id}/role` *(6)* | Admin | 200 | Assign/revoke Analyst only (Admin role changes: OD-16) |
| `GET /admin/audit-events` *(6)* | Admin | 200 | Read-only, paginated; no edit/delete endpoints |

## 5. Still open

OD-03 (strength labels), OD-07 (rate-limit values), OD-10 (language check), OD-17 (session + CSRF mechanism), OD-23 (stored URL display format), F1 (Analyst technical view contents, Phase 6).
