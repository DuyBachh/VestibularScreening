import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SESSION_SCHEMA } from '../src/features/tests/sessionData.js';
import { createSessionRepository } from '../src/services/sessionRepository.js';

function adapter(db) {
  return { runAsync: async (sql, args) => db.prepare(sql).run(...args),
    getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null,
    getAllAsync: async (sql, args) => db.prepare(sql).all(...args) };
}
function fixture(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT, code TEXT, deleted_at INTEGER);
    INSERT OR IGNORE INTO patients (id, owner_id, name, code) VALUES ('p-a', 'a', 'An', 'BN-01'), ('p-b', 'b', 'Bình', 'BN-02');`);
  db.exec(SESSION_SCHEMA);
  const repository = createSessionRepository(async () => adapter(db));
  return { db, repository };
}
function draft(id, patientId = 'p-a', extra = {}) {
  return { id, patientId, testId: 'smooth-pursuit', startedAt: '2026-11-10T08:00:00.000Z', endedAt: '2026-11-10T08:00:35.000Z', elapsedMs: 30000, status: 'completed', cameraStatus: 'not_used', deletedSegments: 0, ...extra };
}

test('vertical runs persist their distinct identity, notes and cancellation state without accepting upcoming tests', async () => {
  const { db, repository: r } = fixture();
  try {
    await r.save('a', draft('vertical', 'p-a', { testId: 'vertical-saccades' }), 'Nhìn theo chiều dọc');
    await r.save('a', draft('vertical-cancel', null, { testId: 'vertical-saccades', status: 'cancelled', elapsedMs: 5000 }), 'Đã dừng');
    assert.equal((await r.get('a', 'vertical')).test_id, 'vertical-saccades');
    assert.equal((await r.get('a', 'vertical')).notes, 'Nhìn theo chiều dọc');
    assert.equal((await r.get('a', 'vertical-cancel')).status, 'cancelled');
    assert.equal(await r.get('b', 'vertical'), null);
    await assert.rejects(r.save('a', draft('upcoming', 'p-a', { testId: 'not-supported' }), ''));
    assert.equal((await r.list('a')).length, 2);
  } finally { db.close(); }
});

test('anti-saccade saves completed and cancelled metadata without inventing gaze scores', async () => {
  const { db, repository: r } = fixture();
  try {
    for (const status of ['completed', 'cancelled']) {
      await r.save('a', draft(`anti-${status}`, 'p-a', { testId: 'anti-saccade', status, elapsedMs: status === 'completed' ? 30000 : 5000 }), 'Ghi chú đối diện');
      const saved = await r.get('a', `anti-${status}`);
      assert.equal(saved.test_id, 'anti-saccade');
      assert.equal(saved.status, status);
      assert.equal(saved.notes, 'Ghi chú đối diện');
      assert.equal('accuracy' in saved, false);
      assert.equal(await r.get('b', `anti-${status}`), null);
    }
  } finally { db.close(); }
});

test('gaze-evoked runs save completed and cancelled metadata with owner isolation', async () => {
  const { db, repository: r } = fixture();
  try {
    for (const status of ['completed', 'cancelled']) {
      await r.save('a', draft(`gaze-${status}`, 'p-a', { testId: 'gaze-evoked', status, elapsedMs: status === 'completed' ? 30000 : 9000 }), 'Giữ ánh nhìn');
      const saved = await r.get('a', `gaze-${status}`);
      assert.equal(saved.test_id, 'gaze-evoked');
      assert.equal(saved.status, status);
      assert.equal(saved.notes, 'Giữ ánh nhìn');
      assert.equal(await r.get('b', `gaze-${status}`), null);
    }
    await assert.rejects(r.save('a', draft('unsupported', 'p-a', { testId: 'not-supported' }), ''));
  } finally { db.close(); }
});

test('OKN saves completed and cancelled runs with camera metadata and owner isolation', async () => {
  const { db, repository: r } = fixture();
  try {
    for (const status of ['completed', 'cancelled']) {
      await r.save('a', draft(`okn-${status}`, 'p-a', { testId: 'okn', status, elapsedMs: status === 'completed' ? 30000 : 9000, cameraStatus: 'deleted', deletedSegments: 2 }), 'Dải chuyển động');
      const saved = await r.get('a', `okn-${status}`);
      assert.equal(saved.test_id, 'okn');
      assert.equal(saved.status, status);
      assert.equal(saved.notes, 'Dải chuyển động');
      assert.equal(saved.deleted_segments, 2);
      assert.equal(await r.get('b', `okn-${status}`), null);
    }
  } finally { db.close(); }
});

test('six exercise sessions keep independent notes and identities under the same patient', async () => {
  const { db, repository: r } = fixture();
  const ids = ['smooth-pursuit', 'horizontal-saccades', 'vertical-saccades', 'anti-saccade', 'gaze-evoked', 'okn'];
  try {
    for (const testId of ids) {
      const session = draft(`chain-${testId}`, 'p-a', { testId });
      await r.save('a', session, `Ghi chú ${testId}`);
      await r.save('a', session, 'Duplicate save');
    }
    const saved = await r.list('a');
    assert.equal(saved.length, 6);
    for (const testId of ids) {
      const session = await r.get('a', `chain-${testId}`);
      assert.equal(session.patient_id, 'p-a');
      assert.equal(session.test_id, testId);
      assert.equal(session.notes, `Ghi chú ${testId}`);
    }
    assert.equal((await r.list('b')).length, 0);
  } finally { db.close(); }
});

test('sessions are scoped to owner for list/read/update and cannot attach another owner patient', async () => {
  const { db, repository: r } = fixture();
  try {
    await r.save('a', draft('a-1'), 'Ghi chú');
    assert.equal((await r.list('b')).length, 0);
    assert.equal(await r.get('b', 'a-1'), null);
    await assert.rejects(r.updateNotes('b', 'a-1', 'Overwrite'));
    await assert.rejects(r.save('b', draft('bad'), ''));
    await assert.rejects(r.save('', draft('empty-owner'), ''));
    assert.equal((await r.get('a', 'a-1')).notes, 'Ghi chú');
  } finally { db.close(); }
});

test('retrying a save creates only one record and keeps original metadata/notes', async () => {
  const { db, repository: r } = fixture();
  try {
    await r.save('a', draft('retry'), 'original');
    await r.save('a', draft('retry'), 'duplicate');
    assert.equal((await r.list('a')).length, 1);
    assert.equal((await r.get('a', 'retry')).notes, 'original');
  } finally { db.close(); }
});

test('patient deletion cascades its sessions while preserving unlinked and other owner sessions', async () => {
  const { db, repository: r } = fixture();
  try {
    await r.save('a', draft('linked'), '');
    await r.save('a', draft('unlinked', null), '');
    await r.save('b', draft('other', 'p-b'), '');
    db.prepare('DELETE FROM patients WHERE id = ? AND owner_id = ?').run('p-a', 'b');
    assert.ok(await r.get('a', 'linked'));
    db.prepare('DELETE FROM patients WHERE id = ? AND owner_id = ?').run('p-a', 'a');
    assert.equal(await r.get('a', 'linked'), null);
    assert.ok(await r.get('a', 'unlinked'));
    assert.ok(await r.get('b', 'other'));
    await assert.rejects(r.save('a', draft('after-delete'), ''));
  } finally { db.close(); }
});

test('history sorts newest first, filters patient and paginates without truncating', async () => {
  const { db, repository: r } = fixture();
  try {
    await r.save('a', draft('old'), '');
    await r.save('a', draft('new', 'p-a', { endedAt: '2026-11-10T09:00:00.000Z' }), '');
    await r.save('a', draft('anonymous', null, { endedAt: '2026-11-10T10:00:00.000Z' }), '');
    assert.deepEqual((await r.list('a', 'p-a')).map((s) => s.id), ['new', 'old']);
    assert.equal((await r.list('a', null, 1, 0))[0].id, 'anonymous');
    assert.equal((await r.list('a', null, 1, 1))[0].id, 'new');
    assert.equal((await r.list('a', null, 1, 2))[0].id, 'old');
  } finally { db.close(); }
});

test('validation rejects impossible completion and unverified camera deletion; notes are bound parameters', async () => {
  const { db, repository: r } = fixture();
  try {
    await assert.rejects(r.save('a', draft('short', 'p-a', { elapsedMs: 1000 }), ''));
    await assert.rejects(r.save('a', draft('bad-camera', 'p-a', { cameraStatus: 'deleted' }), ''));
    await assert.rejects(r.save('a', draft('long-notes'), 'x'.repeat(1001)));
    await r.save('a', draft('cancelled', 'p-a', { elapsedMs: 5000, status: 'cancelled', cameraStatus: 'error' }), "'; DROP TABLE patients; --");
    assert.equal((await r.get('a', 'cancelled')).notes, "'; DROP TABLE patients; --");
    await r.updateNotes('a', 'cancelled', 'Đã cập nhật');
    assert.equal((await r.get('a', 'cancelled')).notes, 'Đã cập nhật');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM patients').get().count, 2);
  } finally { db.close(); }
});

test('metadata and notes survive database close/reopen and migration is repeatable', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'vestibular-session-test-'));
  const path = join(folder, 'sessions.db');
  let current = fixture(path);
  try {
    await current.repository.save('a', draft('persist'), 'Lưu bền');
    current.db.close();
    current = fixture(path);
    assert.equal((await current.repository.get('a', 'persist')).notes, 'Lưu bền');
  } finally { current.db.close(); unlinkSync(path); rmdirSync(folder); }
});
