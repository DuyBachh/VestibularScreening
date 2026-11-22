import test from 'node:test';
import assert from 'node:assert/strict';
import { newBattery, finishBatteryExercise, batterySummary } from '../src/features/tests/batteryFlow.js';
import { supportedTests } from '../src/features/tests/catalog.js';

/** @param {number} index @param {object} [extra] */
function result(index, extra = {}) { return { testId: supportedTests[index].id, sessionId: `run-${index}`, status: 'completed', elapsedMs: 30000, saved: true, cameraError: false, ...extra }; }

test('six ordered runs finish the sequence once with distinct session identities', () => {
  let state = newBattery();
  const original = state;
  for (let index = 0; index < 6; index++) {
    state = finishBatteryExercise(state, result(index), false);
    assert.equal(state.finished, index === 5);
    assert.equal(state.results.length, index + 1);
  }
  assert.deepEqual(batterySummary(state), { completed: 6, cancelled: 0, saved: 6, remaining: 0 });
  assert.equal(original.results.length, 0);
  assert.equal(finishBatteryExercise(state, result(5), false), state);
});

test('duplicate and out-of-order callbacks cannot skip or double-count a run', () => {
  let state = newBattery();
  assert.equal(finishBatteryExercise(state, result(1), false), state);
  state = finishBatteryExercise(state, result(0), false);
  assert.equal(finishBatteryExercise(state, result(0), false), state);
  assert.equal(finishBatteryExercise(state, result(0, { sessionId: 'different' }), false), state);
  assert.equal(finishBatteryExercise(state, result(1, { sessionId: 'run-0' }), false), state);
  assert.equal(state.results.length, 1);
});

test('early end preserves saved results and leaves unattempted exercises separate from cancellation', () => {
  let state = finishBatteryExercise(newBattery(), result(0), false);
  state = finishBatteryExercise(state, result(1, { status: 'cancelled', elapsedMs: 9000, saved: false, cameraError: true }), true);
  assert.equal(state.finished, true);
  assert.deepEqual(batterySummary(state), { completed: 1, cancelled: 1, saved: 1, remaining: 4 });
  assert.equal(state.results[1].cameraError, true);
  assert.equal(finishBatteryExercise(state, result(2), false), state);
});

test('preview or explicitly discarded runs never count as saved history', () => {
  let state = newBattery();
  for (let index = 0; index < 6; index++) state = finishBatteryExercise(state, result(index, { saved: false }), false);
  assert.equal(batterySummary(state).saved, 0);
  assert.equal(batterySummary(state).completed, 6);
  assert.equal(batterySummary(newBattery()).remaining, 6);
});

test('unfinished or invalid results cannot advance the sequence', () => {
  const state = newBattery();
  for (const extra of [{ status: 'paused' }, { status: 'running' }, { elapsedMs: 29000 }, { elapsedMs: -1 }, { elapsedMs: 30001 }, { sessionId: '' }]) {
    assert.equal(finishBatteryExercise(state, result(0, extra), false), state);
  }
  assert.equal(finishBatteryExercise(state, result(0, { status: 'cancelled', elapsedMs: 0 }), false).results.length, 1);
});
