import test from 'node:test';
import assert from 'node:assert/strict';
import { stimulusGeometry } from '../src/features/tests/stimulusGeometry.js';
import { isSupportedTest } from '../src/features/tests/catalog.js';

test('vertical targets stay on the vertical axis and clear the run caption across sizes', () => {
  for (const height of [260, 364, 506]) {
    const { axis, range } = stimulusGeometry('vertical-saccades', 320, height);
    assert.equal(axis, 'translateY');
    for (const position of [-1, 0, 1]) {
      const center = height / 2 + position * range;
      assert.ok(center - 12 >= 0);
      assert.ok(center + 12 <= height - 40);
    }
    assert.deepEqual(stimulusGeometry('vertical-saccades', 600, height), { axis, range });
  }
  assert.deepEqual(stimulusGeometry('vertical-saccades', 320, 180, true), { axis: 'translateY', range: 64 });
});

test('horizontal exercises retain their bounds and invalid extents cannot move outside the stage', () => {
  for (const id of ['smooth-pursuit', 'horizontal-saccades']) {
    assert.deepEqual(stimulusGeometry(id, 320, 260), { axis: 'translateX', range: 130 });
  }
  for (const extent of [0, -10, NaN]) assert.equal(stimulusGeometry('vertical-saccades', 320, extent).range, 0);
  assert.equal(isSupportedTest('vertical-saccades'), true);
  assert.equal(isSupportedTest('anti-saccade'), true);
});
