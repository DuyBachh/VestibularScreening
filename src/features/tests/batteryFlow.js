import { supportedTests } from './catalog.js';

/** @typedef {{testId: string, sessionId: string, status: string, elapsedMs: number, saved: boolean, cameraError: boolean}} BatteryResult */
/** @typedef {{results: BatteryResult[], finished: boolean}} BatteryState */
/** @returns {BatteryState} */
export function newBattery() { return { results: [], finished: false }; }

/** Accept each expected exercise once and in order; duplicate callbacks are harmless.
 * @param {BatteryState} state @param {BatteryResult} result @param {boolean} end */
export function finishBatteryExercise(state, result, end) {
  if (state.finished || state.results.some((item) => item.sessionId === result.sessionId)) return state;
  if (supportedTests[state.results.length]?.id !== result.testId) return state;
  if (!result.sessionId || !['completed', 'cancelled'].includes(result.status)) return state;
  if (!Number.isInteger(result.elapsedMs) || result.elapsedMs < 0 || result.elapsedMs > 30000 || (result.status === 'completed' && result.elapsedMs !== 30000)) return state;
  const results = [...state.results, result];
  return { results, finished: end || results.length === supportedTests.length };
}

/** @param {BatteryState} state */
export function batterySummary(state) {
  return {
    completed: state.results.filter((item) => item.status === 'completed').length,
    cancelled: state.results.filter((item) => item.status === 'cancelled').length,
    saved: state.results.filter((item) => item.saved).length,
    remaining: supportedTests.length - state.results.length,
  };
}
