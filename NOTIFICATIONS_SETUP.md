# Notifications and existing schedule reconciliation

Owner preference: **in-app + iPhone push**, $0 spend, all provider calls disabled.

Verified against existing ChatGPT automations on November 11, 2026 (America/New_York):
- **7 PM daily** Silent Sports Research Prep: enabled, explicitly silent. No extra user-facing notification.
- **11 PM daily** Daily Pro Sports Slips: enabled.
- **11 PM daily** Daily EdgeForce Sims: enabled, separate simulation report.

These schedules currently belong to **ChatGPT Automations**, not the Sports-Collab app. Recording their IDs here does **not** import them, create Vercel cron jobs, or authorize Sports-Collab API calls. Their existing ChatGPT execution is unchanged.

## Notification implementation pending
- In-app: authenticated per-owner notification storage, read/unread status, event audit.
- iPhone push: installable PWA, service worker, user permission, push subscription, secure VAPID secrets and delivery endpoint.
- Provider and schedule integration: persisted idempotency, quota enforcement and explicit owner activation.

Until implemented, `deliveryActive: false` is truthful. No background polling or notification delivery is claimed.
