// Fail-closed owner authentication policy; no live session issuance.
import { timingSafeEqual, createHash } from 'node:crypto';
export const AUTH_ENABLED = false;
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = createHash('sha256').update(a).digest();
  const y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y) && a.length === b.length;
}
export function authorizeOwner({ session, csrfToken, expectedCsrf, origin, allowedOrigin } = {}) {
  if (!AUTH_ENABLED) return { ok: false, status: 503, error: 'Owner authentication disabled' };
  if (!session || session.owner !== true || session.expiresAt <= Date.now()) return { ok: false, status: 401, error: 'Not authenticated' };
  if (!origin || !allowedOrigin || !safeEqual(origin, allowedOrigin)) return { ok: false, status: 403, error: 'Origin denied' };
  if (!csrfToken || !expectedCsrf || !safeEqual(csrfToken, expectedCsrf)) return { ok: false, status: 403, error: 'CSRF denied' };
  return { ok: true };
}
