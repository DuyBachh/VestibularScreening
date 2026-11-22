import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SESSION_SCHEMA } from '../src/features/tests/sessionData.js';
import { PENDING_RUN_SCHEMA, createPendingRunRepository } from '../src/services/pendingRunRepository.js';
import { createSessionRepository } from '../src/services/sessionRepository.js';
import { ACTIVITY_SCHEMA } from '../src/services/activityRepository.js';
import { createPendingWriter } from '../src/features/tests/pendingWriter.js';

function fixture(path = ':memory:', { failAt = '', lostAfter = '' } = {}) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,code TEXT,birth_date TEXT,gender TEXT,notes TEXT,updated_at TEXT,deleted_at INTEGER);
    ${SESSION_SCHEMA} ${ACTIVITY_SCHEMA} ${PENDING_RUN_SCHEMA}
    INSERT OR IGNORE INTO patients(id,owner_id,name,code) VALUES('p-a','a','An','BN-A'),('p-b','b','Bình','BN-B');`);
  let current = true;
  const adapter = {
    runAsync: async (sql, args) => {
      if (failAt && sql.includes(failAt)) throw new Error('Injected failure');
      const result = db.prepare(sql).run(...args);
      if (lostAfter && sql.includes(lostAfter)) current = false;
      return result;
    },
    getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null,
    getAllAsync: async (sql, args) => db.prepare(sql).all(...args),
    withExclusiveTransactionAsync: async (task) => {
      db.exec('BEGIN IMMEDIATE');
      try { await task(adapter); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, repo: createPendingRunRepository(async () => adapter), sessions: createSessionRepository(async () => adapter), isCurrent: () => current };
}
const run = (id, patientId = 'p-a', withCamera = false) => ({ id, patientId, testId: 'smooth-pursuit', startedAt: '2026-11-22T08:00:00Z', withCamera });
const snapshot = (extra = {}) => ({ elapsedMs: 30000, endedAt: '2026-11-22T08:00:35Z', status: 'completed', cameraStatus: 'not_used', deletedSegments: 0, notes: 'Bản nháp <giữ nguyên>', ...extra });

test('drafts isolate owners, keep editable notes and never copy patient names or video fields', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s-a'), f.isCurrent);
    await f.repo.begin('b', run('s-b', 'p-b'), f.isCurrent);
    assert.equal(await f.repo.update('a', 's-a', snapshot(), 1), true);
    assert.equal(await f.repo.update('b', 's-a', snapshot({ notes: 'attack' }), 10), false);
    await f.repo.remove('b', 's-a');
    assert.equal((await f.repo.get('a', 's-a')).notes, 'Bản nháp <giữ nguyên>');
    assert.equal(await f.repo.get('b', 's-a'), null);
    assert.equal(await f.repo.count('a'), 1);
    assert.equal((await f.repo.list('b')).length, 1);
    const columns = f.db.prepare('PRAGMA table_info(pending_runs)').all().map((row) => row.name);
    assert.ok(!columns.some((column) => /name|video|uri|token/.test(column)));
    await assert.rejects(f.repo.begin('a', run('foreign', 'p-b'), f.isCurrent));
    await assert.rejects(f.repo.begin('', run('invalid'), f.isCurrent));
  } finally { f.db.close(); }
});

test('revisions and monotonic progress prevent delayed writes from overwriting later state', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s'), f.isCurrent);
    await f.repo.update('a', 's', snapshot({ status: 'active', elapsedMs: 7000, endedAt: '', notes: 'new' }), 2);
    assert.equal(await f.repo.update('a', 's', snapshot({ status: 'active', elapsedMs: 5000, endedAt: '', notes: 'old' }), 1), false);
    assert.equal(await f.repo.update('a', 's', snapshot({ status: 'active', elapsedMs: 6000, endedAt: '' }), 3), false);
    await f.repo.update('a', 's', snapshot(), 4);
    assert.equal(await f.repo.update('a', 's', snapshot({ status: 'active' }), 5), false);
    assert.equal((await f.repo.get('a', 's')).revision, 4);
  } finally { f.db.close(); }
});

test('recovery saves once and removes the draft atomically, including late writer updates', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s'), f.isCurrent);
    await f.repo.update('a', 's', snapshot(), 1);
    await f.repo.recover('a', 's', 'Ghi chú mới nhất', f.isCurrent);
    assert.equal(await f.repo.count('a'), 0);
    assert.equal((await f.sessions.get('a', 's')).notes, 'Ghi chú mới nhất');
    assert.equal(await f.repo.update('a', 's', snapshot({ notes: 'late' }), 100), false);
    await assert.rejects(f.repo.recover('a', 's', 'duplicate', f.isCurrent));
    assert.equal((await f.sessions.list('a')).length, 1);
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM activity_events WHERE event='session_saved'").get().n, 1);
  } finally { f.db.close(); }
});

test('normal history save also removes its draft through a transaction-scoped trigger', async () => {
  const f = fixture();
  try {
    const original = run('s');
    await f.repo.begin('a', original, f.isCurrent);
    await f.sessions.save('a', { ...original, ...snapshot(), cameraStatus: 'not_used' }, 'manual');
    assert.equal(await f.repo.get('a', 's'), null);
    assert.equal(await f.repo.update('a', 's', snapshot(), 1), false);
    await assert.rejects(f.repo.begin('a', original, f.isCurrent));
  } finally { f.db.close(); }
});

test('active checkpoints cannot be promoted to completed history even with 30 seconds elapsed', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s', null, true), f.isCurrent);
    await f.repo.update('a', 's', snapshot({ status: 'active', endedAt: '', cameraStatus: 'pending' }), 1);
    await assert.rejects(f.repo.recover('a', 's', '', f.isCurrent), /gián đoạn/);
    assert.equal((await f.sessions.list('a')).length, 0);
    assert.equal((await f.repo.get('a', 's')).camera_status, 'pending');
    await assert.rejects(f.repo.update('a', 's', snapshot({ elapsedMs: 20000 }), 2));
    await assert.rejects(f.repo.update('a', 's', snapshot({ cameraStatus: 'pending' }), 2));
  } finally { f.db.close(); }
});

test('explicit cancellation and camera error stay explicit when recovered', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s', null, true), f.isCurrent);
    await f.repo.update('a', 's', snapshot({ status: 'cancelled', elapsedMs: 4500, cameraStatus: 'error' }), 1);
    await f.repo.recover('a', 's', 'Có lỗi camera', f.isCurrent);
    const saved = await f.sessions.get('a', 's');
    assert.equal(saved.status, 'cancelled'); assert.equal(saved.camera_status, 'error');
    assert.equal(saved.elapsed_ms, 4500);
  } finally { f.db.close(); }
});

test('recovery rollback keeps the draft and removes history/audit changes when account or storage changes', async () => {
  for (const options of [{ failAt: 'INSERT INTO test_sessions' }, { lostAfter: 'INSERT INTO test_sessions' }]) {
    const f = fixture(':memory:', options);
    try {
      await f.repo.begin('a', run('s'), () => true);
      await f.repo.update('a', 's', snapshot(), 1);
      await assert.rejects(f.repo.recover('a', 's', 'retry', f.isCurrent));
      assert.equal(await f.repo.count('a'), 1);
      assert.equal((await f.sessions.list('a')).length, 0);
      assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM activity_events WHERE event='session_saved'").get().n, 0);
    } finally { f.db.close(); }
  }
});

test('begin rolls back when account changes during creation; missing or trashed patients cannot be used', async () => {
  const f = fixture(':memory:', { lostAfter: 'INSERT INTO pending_runs' });
  try {
    await assert.rejects(f.repo.begin('a', run('s'), f.isCurrent));
    assert.equal(await f.repo.count('a'), 0);
    f.db.prepare("UPDATE patients SET deleted_at=1 WHERE id='p-a'").run();
    await assert.rejects(f.repo.begin('a', run('trash'), () => true));
    await assert.rejects(f.repo.begin('a', run('missing', 'not-present'), () => true));
  } finally { f.db.close(); }
});

test('trash hides drafts and blocks writes/recovery; restoring exposes them; permanent deletion cascades', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s'), f.isCurrent); await f.repo.update('a', 's', snapshot(), 1);
    f.db.prepare("UPDATE patients SET deleted_at=1 WHERE id='p-a'").run();
    assert.equal(await f.repo.count('a'), 0); assert.equal(await f.repo.get('a', 's'), null);
    assert.equal(await f.repo.update('a', 's', snapshot(), 2), false);
    await assert.rejects(f.repo.recover('a', 's', '', f.isCurrent));
    f.db.prepare("UPDATE patients SET deleted_at=NULL WHERE id='p-a'").run();
    assert.equal(await f.repo.count('a'), 1);
    f.db.prepare("DELETE FROM patients WHERE id='p-a'").run();
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM pending_runs').get().n, 0);
    assert.equal(await f.repo.update('a', 's', snapshot(), 3), false);
  } finally { f.db.close(); }
});

test('draft notes survive closing/reopening storage and migration is repeatable', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pending-run-')); const path = join(dir, 'test.db');
  try {
    let f = fixture(path);
    await f.repo.begin('a', run('s'), f.isCurrent); await f.repo.update('a', 's', snapshot({ notes: 'đã lưu bền' }), 1); f.db.close();
    f = fixture(path);
    try {
      assert.equal((await f.repo.list('a'))[0].notes, 'đã lưu bền');
      assert.equal(await f.repo.count('a'), 1);
      f.db.exec(PENDING_RUN_SCHEMA);
      assert.equal(await f.repo.count('a'), 1);
    } finally { f.db.close(); }
  } finally { unlinkSync(path); rmdirSync(dir); }
});

test('discarded drafts never reappear from an in-flight writer', async () => {
  const f = fixture();
  try {
    await f.repo.begin('a', run('s'), f.isCurrent);
    await f.repo.remove('a', 's');
    assert.equal(await f.repo.update('a', 's', snapshot(), 1), false);
    assert.equal(await f.repo.count('a'), 0);
    assert.equal((await f.sessions.list('a')).length, 0);
  } finally { f.db.close(); }
});

test('serialized writer coalesces edits without acknowledging before persistence and flush waits for newest edit', async () => {
  const writes = []; const states = []; const releases = [];
  const writer = createPendingWriter({ write: async (value, revision) => { writes.push([value, revision]); await new Promise((resolve) => releases.push(resolve)); return true; }, onState: (state) => states.push(state) });
  writer.set('a'); writer.set('b'); writer.set('c');
  assert.deepEqual(writes, [['a', 1]]); assert.ok(!states.includes('saved'));
  let flushed = false; const flushing = writer.flush().then(() => { flushed = true; });
  releases.shift()(); await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(writes, [['a', 1], ['c', 3]]); assert.equal(flushed, false);
  releases.shift()(); await flushing;
  assert.equal(flushed, true); assert.equal(states.at(-1), 'saved');
});

test('failed writer keeps the latest pending note for explicit retry; closing blocks later checkpoints', async () => {
  let broken = true; const writes = []; const states = [];
  const writer = createPendingWriter({ write: async (value) => { if (broken) throw new Error('disk'); writes.push(value); return true; }, onState: (state) => states.push(state) });
  writer.set('old'); writer.set('new');
  await assert.rejects(writer.flush(), /disk/); assert.equal(states.at(-1), 'error');
  broken = false; await writer.flush();
  assert.deepEqual(writes, ['new']); assert.equal(states.at(-1), 'saved');
  writer.close(); writer.set('must not write'); await writer.flush(); assert.deepEqual(writes, ['new']);
});
