// Screen-space learning animation, not a calibrated clinical OKN stimulus.
export const OKN_STRIPE_WIDTH = 28;
export const OKN_SPEED = 30;

/** @param {number} elapsedMs @param {boolean} [preview] */
export function oknMotionPlan(elapsedMs, preview = false) {
  const duration = preview ? 8000 : 30000;
  const midpoint = duration / 2;
  const elapsed = Number.isFinite(elapsedMs) ? Math.min(duration, Math.max(0, elapsedMs)) : 0;
  const peak = midpoint / 1000 * OKN_SPEED;
  const start = (elapsed <= midpoint ? elapsed : duration - elapsed) / 1000 * OKN_SPEED;
  const steps = elapsed < midpoint
    ? [{ toValue: peak, duration: midpoint - elapsed }, { toValue: 0, duration: midpoint }]
    : elapsed < duration ? [{ toValue: 0, duration: duration - elapsed }] : [];
  return { start, steps };
}

/** Extra whole periods cover both edges throughout the native-driver wrap.
 * @param {number} width */
export function oknStripeCount(width) { return Math.ceil(Math.max(0, Number.isFinite(width) ? width : 0) / OKN_STRIPE_WIDTH) + 4; }
