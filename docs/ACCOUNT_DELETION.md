# Account deletion: instructions and API

This document describes the public deletion page and server API used to let users permanently delete their ResetDopa account.

Live page
- `/account/delete/` — public HTML page intended to be hosted at `https://resetdopa.com/account/delete/`.
- `/account/delete/confirm/` — confirmation page that consumes the one-time deletion token from email.

Email for support
- privacy@resetdopa.com

Recommended minimal API

- POST `/api/account/delete-request`
  - Auth: required (session) or accept email for confirmation
  - Action: create a deletion job and email a signed confirmation link to the account email
  - Response: 202 Accepted { jobId }

- POST `/api/account/delete-confirm`
  - Body: { token }
  - Action: validate token, perform deletion (or schedule final removal), return reference id
  - Response: 200 OK { deleted: true, referenceId }

- GET `/api/account/delete-status?jobId=...`
  - Action: return current job status
  - Response: 200 OK { status: "pending"|"completed"|"failed", details }

Suggested copy for Play Console "Account deletion URL" field

"https://resetdopa.com/account/delete/ — page where authenticated users can request permanent account deletion. Requires email confirmation and returns a deletion reference id upon completion. Contact: privacy@resetdopa.com"

Developer notes
- Ensure the public page loads without requiring admin privileges; the deletion action must verify identity before removing data.
- Log deletion events (minimal metadata) for compliance and troubleshooting.
