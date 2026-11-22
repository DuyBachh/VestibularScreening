import test from 'node:test';
import assert from 'node:assert/strict';
import { oknMotionPlan, oknStripeCount, OKN_STRIPE_WIDTH, OKN_SPEED } from '../src/features/tests/oknMotion.js';

test('OKN moves continuously right then left at the exact halfway boundary', () => {
  const beginning = oknMotionPlan(0);
  assert.equal(beginning.start, 0);
  assert.deepEqual(beginning.steps, [{ toValue: 450, duration: 15000 }, { toValue: 0, duration: 15000 }]);
  assert.ok(oknMotionPlan(14999).start < oknMotionPlan(15000).start);
  assert.ok(oknMotionPlan(15001).start < oknMotionPlan(15000).start);
  assert.deepEqual(oknMotionPlan(15000).steps, [{ toValue: 0, duration: 15000 }]);
  assert.deepEqual(oknMotionPlan(30000), { start: 0, steps: [] });
});

test('resume preserves position, speed and the remaining reversal schedule in both halves', () => {
  for (const elapsed of [8200, 14999, 15000, 23000]) {
    const plan = oknMotionPlan(elapsed);
    assert.deepEqual(oknMotionPlan(elapsed), plan);
    assert.equal(plan.steps.reduce((total, step) => total + step.duration, 0), 30000 - elapsed);
    let from = plan.start;
    for (const step of plan.steps) {
      assert.ok(Math.abs(Math.abs(step.toValue - from) / step.duration * 1000 - OKN_SPEED) < 0.000001);
      from = step.toValue;
    }
  }
});

test('preview reverses at four seconds and invalid or finished times cannot extend animation', () => {
  assert.deepEqual(oknMotionPlan(0, true).steps, [{ toValue: 120, duration: 4000 }, { toValue: 0, duration: 4000 }]);
  assert.deepEqual(oknMotionPlan(4000, true), { start: 120, steps: [{ toValue: 0, duration: 4000 }] });
  for (const elapsed of [-1, NaN, Infinity]) assert.deepEqual(oknMotionPlan(elapsed), oknMotionPlan(0));
  assert.deepEqual(oknMotionPlan(9000, true), { start: 0, steps: [] });
});

test('repeating stripe field covers both edges at every wrap offset on narrow and wide screens', () => {
  for (const width of [1, 280, 393, 600, 1024]) {
    const fieldWidth = oknStripeCount(width) * OKN_STRIPE_WIDTH;
    for (const shift of [-56, -35, -1, 0]) {
      assert.ok(shift <= 0);
      assert.ok(fieldWidth + shift >= width);
    }
  }
});
