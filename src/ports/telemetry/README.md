# Telemetry Port

This module defines the Phase A structural event contract. It does not enable telemetry or provide a network adapter.

## Privacy boundary

- Telemetry is disabled unless an adapter is explicitly created and injected.
- Events cannot contain conversation text, prompts, API keys, URLs, entity IDs, model names, company names, or personal data.
- The Phase A in-memory adapter retains aggregate counts only for the current page lifetime. Reloading clears them.
- No external adapter, persistence, account, cookie, fingerprint, or network request is included.

## Event dictionary

| Event | Purpose | Allowed fields |
| :--- | :--- | :--- |
| `decision_created` | Measure entry into the decision workflow | None |
| `branch_confirmed` | Measure user-confirmed structure | `branchKind` |
| `perspective_completed` | Diagnose independent-perspective reliability | `outcome` |
| `evidence_added` | Measure evidence classification | `evidenceKind` |
| `draft_built` | Measure arrival at synthesis | None |
| `status_changed` | Count user-confirmed completion | `targetStatus`, fixed `actor: user` |
| `decision_exported` | Measure external review intent | `format` |
| `workflow_blocked` | Diagnose workflow blockers | Stable `errorCode` only |

Any external telemetry adapter requires separate authorization, a documented retention period, a visible disable control, and tests proving that sensitive content cannot leave the device.
