import assert from 'node:assert/strict';
import test from 'node:test';
import { runClock, runPresentation } from '../src/features/tests/runPresentation.js';

const input = { status: 'running', withCamera: true, cameraBusy: true, cameraError: '', foreground: true };

test('busy recording remains a live run rather than being mislabeled video cleanup', () => {
  const ui = runPresentation(input);
  assert.equal(ui.cameraPhase, 'recording');
  assert.equal(ui.processing, false);
  assert.equal(ui.canEnd, true);
  assert.equal(ui.showResult, false);
});

test('paused and terminal runs wait for recording cleanup before resume, exit controls or saving', () => {
  for (const status of ['paused', 'completed', 'cancelled']) {
    const ui = runPresentation({ ...input, status });
    assert.equal(ui.processing, true, status);
    assert.equal(ui.canResume, false, status);
    assert.equal(ui.canEnd, false, status);
    assert.equal(ui.showResult, false, status);
    assert.equal(ui.cameraPhase, 'stopping', status);
  }
  assert.equal(runPresentation({ ...input, status: 'completed', cameraBusy: false }).showResult, true);
  assert.equal(runPresentation({ ...input, status: 'cancelled', cameraBusy: false }).showResult, true);
});

test('camera errors never announce recording success and cannot resume, but allow ending after cleanup', () => {
  const failed = { ...input, status: 'paused', cameraError: 'native failure' };
  assert.equal(runPresentation(failed).showError, false);
  const ui = runPresentation({ ...failed, cameraBusy: false });
  assert.equal(ui.showError, true);
  assert.equal(ui.cameraPhase, 'error');
  assert.equal(ui.canResume, false);
  assert.equal(ui.canEnd, true);
});

test('opening and arming never imply confirmed recording; foreground is required for resuming', () => {
  assert.equal(runPresentation({ ...input, status: 'preparing', cameraBusy: false }).cameraPhase, 'opening');
  assert.equal(runPresentation({ ...input, status: 'countdown', cameraBusy: false }).cameraPhase, 'ready');
  assert.equal(runPresentation({ ...input, status: 'arming' }).cameraPhase, 'starting');
  assert.equal(runPresentation({ ...input, status: 'paused', cameraBusy: false, foreground: false }).canResume, false);
  assert.equal(runPresentation({ ...input, status: 'paused', cameraBusy: false }).canResume, true);
});

test('no-camera runs can resume and finish without waiting for recording work', () => {
  const paused = runPresentation({ ...input, status: 'paused', withCamera: false, cameraBusy: false });
  assert.equal(paused.processing, false);
  assert.equal(paused.canResume, true);
  assert.equal(runPresentation({ ...input, withCamera: false, cameraBusy: false, status: 'completed' }).showResult, true);
});

test('remaining-time formatting preserves countdown boundaries and rejects invalid ranges', () => {
  assert.equal(runClock(30), '00:30');
  assert.equal(runClock(24), '00:24');
  assert.equal(runClock(0), '00:00');
  assert.equal(runClock(-1), '00:00');
  assert.equal(runClock(100), '00:30');
  assert.equal(runClock(NaN), '00:30');
});
