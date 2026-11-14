# Sports-Collab passkey-first owner sign-in

Chosen: WebAuthn/FIDO2 passkeys with user verification required. On compatible iPhones Safari may offer Face ID to unlock a passkey. Face ID is managed by iOS; the app never receives biometric data. Passkeys may also work with other device unlock methods.

Current status: **not active**. Public enrollment is explicitly refused, as is login. No billable API calls.

To activate safely without a paid authentication service:
1. Choose and configure a durable, free-tier server-side credential/challenge/session store. Do not assume Vercel serverless memory or localStorage persists securely.
2. Establish the initial owner's identity through a verified bootstrap outside the public registration endpoint. Only that owner may enroll credentials.
3. Bind WebAuthn challenges to a session and relying-party ID/domain. Verify origin, challenge, RP ID hash, signature, credential ID, UV flag, and credential counter/backup behavior on the server.
4. Store public credential keys and owner IDs server-side, with revocation and recovery. Never store biometric data.
5. Add authenticated short-lived sessions, CSRF and exact-origin validation, replay prevention and rate limiting.
6. Test Safari iPhone and PWA flows and negative cases. Deploy to preview before production.
7. Maintain the $0 policy and providerRequestsEnabled=false regardless of login state until separate owner approval.

Do not enter private keys or API secrets into the app, chat, or GitHub.
