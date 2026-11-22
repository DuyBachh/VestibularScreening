import assert from 'node:assert/strict';
import test from 'node:test';
import { appendDemoSession, DEMO_PATIENTS, runCapabilities } from '../src/features/demo/demoData.js';

test('demo removes account owner and camera capability even while signed in', () => {
  assert.deepEqual(runCapabilities({ demo: true, signedIn: true, userId: 'real-user' }), { ownerId: undefined, cameraAllowed: false });
  assert.deepEqual(runCapabilities({ demo: true, signedIn: false, userId: undefined }), { ownerId: undefined, cameraAllowed: false });
  assert.deepEqual(runCapabilities({ demo: false, signedIn: true, userId: 'real-user' }), { ownerId: 'real-user', cameraAllowed: true });
  assert.equal(runCapabilities({ demo: false, signedIn: false, userId: 'expired-user' }).ownerId, undefined);
});

test('fixtures are immutable, explicitly demo and only use Nam/Nữ', () => {
  assert.equal(DEMO_PATIENTS.length, 2);
  for (const patient of DEMO_PATIENTS) {
    assert.ok(patient.id.startsWith('demo-'));
    assert.ok(patient.code.startsWith('DEMO-'));
    assert.ok(['Nam', 'Nữ'].includes(patient.gender));
    assert.ok(Object.isFrozen(patient));
  }
  assert.ok(Object.isFrozen(DEMO_PATIENTS));
});

test('adding demo metadata creates a new memory list, with no mutation of prior notes', () => {
  const previous = [{ id: 'one', patientName: 'Mẫu', testId: 'smooth-pursuit', elapsedMs: 30000, status: 'completed', notes: 'old' }];
  const added = { ...previous[0], id: 'two', notes: ' ghi chú mới ' };
  const next = appendDemoSession(previous, added);
  assert.equal(next[0].notes, 'ghi chú mới');
  assert.equal(previous.length, 1);
  assert.equal(previous[0].notes, 'old');
  assert.equal(added.notes, ' ghi chú mới ');
  assert.notEqual(next, previous);
});

test('memory list deduplicates retries and is bounded to ten sessions', () => {
  let list = [];
  for (let index = 0; index < 20; index++) list = appendDemoSession(list, { id: String(index), patientName: 'Mẫu', testId: 'horizontal-saccades', elapsedMs: 5000, status: 'cancelled', notes: 'x'.repeat(1001) });
  assert.equal(list.length, 10);
  assert.equal(list[0].id, '19');
  assert.equal(list[0].notes.length, 1000);
  list = appendDemoSession(list, { ...list[0], notes: 'retry' });
  assert.equal(list.length, 10);
  assert.equal(list.filter((item) => item.id === '19').length, 1);
});
