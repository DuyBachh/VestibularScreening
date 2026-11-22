import test from 'node:test';
import assert from 'node:assert/strict';
import { gazeCueAt, GAZE_HOLD_MS, GAZE_PREVIEW_HOLD_MS } from '../src/features/tests/gazeCue.js';

test('gaze holds each position for six seconds with exact transitions across the 30-second run', () => {
  const expected = [0, -1, 0, 1, 0];
  expected.forEach((position, index) => {
    assert.equal(gazeCueAt(index * GAZE_HOLD_MS), position);
    assert.equal(gazeCueAt((index + 1) * GAZE_HOLD_MS - 1), position);
  });
  assert.equal(gazeCueAt(30000), 0);
});

test('pausing leaves a hold unchanged and resume uses remaining active time rather than restarting', () => {
  const elapsed = 9500;
  for (let pausedFrame = 0; pausedFrame < 100; pausedFrame++) assert.equal(gazeCueAt(elapsed), -1);
  assert.equal(gazeCueAt(elapsed + 2499), -1);
  assert.equal(gazeCueAt(elapsed + 2500), 0);
  for (const elapsed of [-10, NaN, Infinity]) assert.equal(gazeCueAt(elapsed), 0);
  assert.equal(gazeCueAt(999999), 0);
});

test('eight-second preview follows the same sequence with explicitly shorter holds', () => {
  [0, -1, 0, 1, 0].forEach((position, index) => {
    assert.equal(gazeCueAt(index * GAZE_PREVIEW_HOLD_MS, true), position);
    assert.equal(gazeCueAt((index + 1) * GAZE_PREVIEW_HOLD_MS - 1, true), position);
  });
  assert.equal(GAZE_PREVIEW_HOLD_MS * 5, 8000);
});
