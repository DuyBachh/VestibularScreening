export const IDLE_TIMEOUT = 15 * 60 * 1000;

/** @param {number} lastActivity @param {number} now */
export function isSessionIdle(lastActivity, now) {
  return !Number.isFinite(lastActivity) || lastActivity <= 0 || lastActivity > now || now - lastActivity >= IDLE_TIMEOUT;
}
