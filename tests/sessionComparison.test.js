import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSessionMetadata, loadSessionComparison } from '../src/features/tests/sessionComparison.js';

const old = { id: 's1', patient_id: 'p1', patient_name: 'An', patient_code: 'BN-01', test_id: 'smooth-pursuit', started_at: '2026-11-10T08:00:00Z', ended_at: '2026-11-10T08:00:10Z', elapsed_ms: 5000, status: 'cancelled', camera_status: 'error', deleted_segments: 0, notes: 'Ghi chú cũ' };
const recent = { ...old, id: 's2', ended_at: '2026-11-10T09:00:35Z', elapsed_ms: 30000, status: 'completed', camera_status: 'deleted', deleted_segments: 1, notes: 'Ghi chú mới' };

test('selection order does not affect chronological comparison or duration difference', () => {
  const value = compareSessionMetadata(recent, old);
  assert.equal(value.earlier.id, old.id);
  assert.equal(value.later.id, recent.id);
  assert.equal(value.deltaMs, 25000);
  assert.deepEqual(value, compareSessionMetadata(old, recent));
  assert.equal(old.notes, 'Ghi chú cũ');
  assert.equal(value.earlier.camera_status, 'error');
  assert.equal(value.earlier.status, 'cancelled');
});

test('duplicate, unlinked, mismatched patients and tests are rejected', () => {
  assert.throws(() => compareSessionMetadata(old, old), /khác nhau/);
  assert.throws(() => compareSessionMetadata(old, { ...recent, patient_id: null }), /gắn hồ sơ/);
  assert.throws(() => compareSessionMetadata(old, { ...recent, patient_id: 'p2' }), /cùng một bệnh nhân/);
  assert.throws(() => compareSessionMetadata(old, { ...recent, test_id: 'horizontal-saccades' }), /cùng một bài/);
});

test('equal timestamps sort deterministically; invalid dates are not treated as newest', () => {
  const equalTime = { ...recent, ended_at: old.ended_at, elapsed_ms: old.elapsed_ms };
  const value = compareSessionMetadata(equalTime, old);
  assert.equal(value.earlier.id, 's1');
  assert.equal(value.deltaMs, 0);
  assert.throws(() => compareSessionMetadata(old, { ...recent, ended_at: 'broken' }), /Thời gian/);
});

test('loader scopes both lookups to current owner and rejects missing/foreign sessions', async () => {
  const calls = [];
  const get = async (owner, id) => { calls.push([owner, id]); return id === 's1' ? old : null; };
  await assert.rejects(loadSessionComparison(get, 'owner-a', 's1', 'other-owner-session'), /không thuộc tài khoản/);
  assert.deepEqual(calls, [['owner-a', 's1'], ['owner-a', 'other-owner-session']]);
});

test('loader rejects unauthenticated or duplicate input before accessing database', async () => {
  let reads = 0;
  const get = async () => { reads++; return old; };
  await assert.rejects(loadSessionComparison(get, '', 's1', 's2'), /đăng nhập/);
  await assert.rejects(loadSessionComparison(get, 'owner', 's1', 's1'), /khác nhau/);
  await assert.rejects(loadSessionComparison(get, 'owner', '', 's2'), /khác nhau/);
  assert.equal(reads, 0);
});
