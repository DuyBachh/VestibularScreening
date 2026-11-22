// Learning simulation only; these durations are not a validated clinical protocol.
const positions = [0, -1, 0, 1, 0];
export const GAZE_HOLD_MS = 6000;
export const GAZE_PREVIEW_HOLD_MS = 1600;

/** Use accumulated active time so pausing does not restart or skip a hold.
 * @param {number} elapsedMs @param {boolean} [preview] */
export function gazeCueAt(elapsedMs, preview = false) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const hold = preview ? GAZE_PREVIEW_HOLD_MS : GAZE_HOLD_MS;
  return positions[Math.min(positions.length - 1, Math.floor(elapsed / hold))];
}
