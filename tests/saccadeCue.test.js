import test from 'node:test';
import assert from 'node:assert/strict';
import { nextSaccadeCue } from '../src/features/tests/saccadeCue.js';

test('anti-saccade leaves the initial center and only presents distinct side cues', () => {
  for (const random of [0, 0.49, 0.99, 1, -1, NaN]) {
    let previous = 0;
    for (let trial = 0; trial < 40; trial++) {
      const cue = nextSaccadeCue('anti-saccade', previous, random);
      assert.ok(cue === -1 || cue === 1);
      assert.notEqual(cue, previous);
      previous = cue;
    }
  }
});

test('ordinary saccades retain all three positions and never repeat the current target', () => {
  for (const id of ['horizontal-saccades', 'vertical-saccades']) {
    const seen = new Set();
    for (const previous of [-1, 0, 1]) {
      for (const random of [0, 0.99]) {
        const cue = nextSaccadeCue(id, previous, random);
        assert.notEqual(cue, previous);
        seen.add(cue);
      }
    }
    assert.deepEqual([...seen].sort(), [-1, 0, 1]);
  }
});
