# iPhone notification implementation

PWA manifest and an offline-only service worker are present. **Push is not active.**

The service worker does not subscribe to push, register background sync, fetch APIs, or schedule research.

Required before push activation:
1. User adds the HTTPS web app to iPhone Home Screen (supported iOS versions).
2. User explicitly taps an Enable Notifications control and grants OS permission.
3. Authenticated owner identity and per-device subscription storage.
4. Server-side VAPID signing secrets, never committed to GitHub or exposed to browser.
5. Delivery endpoint with authentication, idempotency and strict event allowlist.
6. Only owner-requested and approved-schedule events. Silent 7 PM preparation remains silent.
7. Confirm free-tier usage and $0 cost policy before activation.

Never treat a saved push preference as browser permission or a functioning push subscription.
