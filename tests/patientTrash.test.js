import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { SESSION_SCHEMA } from '../src/features/tests/sessionData.js';
import { createSessionRepository } from '../src/services/sessionRepository.js';
import { createPatientTrashRepository, PATIENT_TRASH_MIGRATION, RETENTION_MS } from '../src/services/patientTrashRepository.js';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE patients (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
      birth_date TEXT NOT NULL DEFAULT '', gender TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
      search_key TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(owner_id, code));
    INSERT INTO patients (id,owner_id,code,name,birth_date,gender,notes,created_at,updated_at) VALUES
      ('p-a','a','BN-01','An','2000-02-29','Nam','ghi chú hồ sơ','2026-11-01','2026-11-01'),
      ('p-b','b','BN-01','Bình','','Nữ','','2026-11-01','2026-11-01'),
      ('p-c','a','BN-02','Chi','','Nữ','','2026-11-01','2026-11-01');
    ${SESSION_SCHEMA} PRAGMA user_version = 3;
    INSERT INTO test_sessions VALUES ('old','a','p-a','smooth-pursuit','2026-11-01T08:00:00Z','2026-11-01T08:00:35Z',30000,'completed','not_used',0,'ghi chú phiên');`);
  db.exec(`BEGIN; ${PATIENT_TRASH_MIGRATION} PRAGMA user_version = 4; COMMIT;`);
  let now = Date.parse('2026-11-11T08:00:00Z');
  const adapter = { runAsync: async (sql, args) => db.prepare(sql).run(...args), getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null, getAllAsync: async (sql, args) => db.prepare(sql).all(...args) };
  const get = async () => adapter;
  return { db, trash: createPatientTrashRepository(get, () => now), sessions: createSessionRepository(get), advance: (ms) => { now += ms; } };
}
const draft = (id, patientId) => ({ id, patientId, testId: 'smooth-pursuit', startedAt: '2026-11-11T08:00:00Z', endedAt: '2026-11-11T08:00:35Z', elapsedMs: 30000, status: 'completed', cameraStatus: 'not_used', deletedSegments: 0 });

test('v3 to v4 migration preserves patients, session notes, IDs and foreign keys', async () => {
  const f = fixture();
  try {
    assert.equal(f.db.prepare('PRAGMA user_version').get().user_version, 4);
    assert.equal(f.db.prepare("SELECT deleted_at FROM patients WHERE id='p-a'").get().deleted_at, null);
    assert.equal((await f.sessions.get('a', 'old')).notes, 'ghi chú phiên');
    assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length, 0);
  } finally { f.db.close(); }
});

test('soft deletion preserves storage but hides sessions and blocks read/write/save paths', async () => {
  const f = fixture();
  try {
    assert.equal(await f.trash.moveToTrash('a', 'p-a'), true);
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM test_sessions WHERE patient_id='p-a'").get().n, 1);
    assert.equal(await f.sessions.get('a', 'old'), null);
    assert.equal((await f.sessions.list('a')).length, 0);
    await assert.rejects(f.sessions.updateNotes('a', 'old', 'changed'));
    await assert.rejects(f.sessions.save('a', draft('new', 'p-a'), ''));
    await assert.rejects(f.sessions.save('a', draft('old', 'p-a'), 'retry'));
    const rows = await f.trash.list('a');
    assert.equal(rows[0].session_count, 1);
  } finally { f.db.close(); }
});

test('restore just before expiry returns same profile and history without overwriting notes', async () => {
  const f = fixture();
  try {
    await f.trash.moveToTrash('a', 'p-a');
    f.advance(RETENTION_MS - 1);
    assert.equal(await f.trash.restore('a', 'p-a'), true);
    assert.equal((await f.sessions.get('a', 'old')).notes, 'ghi chú phiên');
    const patient = f.db.prepare("SELECT * FROM patients WHERE id='p-a'").get();
    assert.equal(patient.birth_date, '2000-02-29');
    assert.equal(patient.gender, 'Nam');
    assert.equal(patient.notes, 'ghi chú hồ sơ');
    assert.equal(patient.deleted_at, null);
    assert.equal((await f.trash.list('a')).length, 0);
  } finally { f.db.close(); }
});

test('at exactly 30 days expiry cascades only this owner expired trash, preserving active and unlinked data', async () => {
  const f = fixture();
  try {
    await f.sessions.save('a', draft('anonymous', null), '');
    await f.sessions.save('a', draft('active', 'p-c'), '');
    await f.sessions.save('b', draft('other-owner', 'p-b'), '');
    await f.trash.moveToTrash('a', 'p-a');
    await f.trash.moveToTrash('b', 'p-b');
    f.advance(RETENTION_MS);
    assert.equal(await f.trash.restore('a', 'p-a'), false);
    assert.equal(f.db.prepare("SELECT * FROM patients WHERE id='p-a'").get(), undefined);
    assert.equal(f.db.prepare("SELECT * FROM test_sessions WHERE id='old'").get(), undefined);
    assert.ok(f.db.prepare("SELECT * FROM patients WHERE id='p-b'").get());
    assert.ok(await f.sessions.get('a', 'anonymous'));
    assert.ok(await f.sessions.get('a', 'active'));
  } finally { f.db.close(); }
});

test('other owners cannot trash/restore/permanently delete known IDs', async () => {
  const f = fixture();
  try {
    assert.equal(await f.trash.moveToTrash('b', 'p-a'), false);
    await f.trash.moveToTrash('a', 'p-a');
    assert.equal(await f.trash.restore('b', 'p-a'), false);
    assert.equal(await f.trash.removePermanently('b', 'p-a'), false);
    assert.equal((await f.trash.list('b')).length, 0);
    await assert.rejects(f.trash.purgeExpired(''));
  } finally { f.db.close(); }
});

test('permanent removal only accepts trashed patients and cascades their sessions', async () => {
  const f = fixture();
  try {
    assert.equal(await f.trash.removePermanently('a', 'p-a'), false);
    await f.trash.moveToTrash('a', 'p-a');
    assert.equal(await f.trash.removePermanently('a', 'p-a'), true);
    assert.equal(f.db.prepare("SELECT * FROM test_sessions WHERE id='old'").get(), undefined);
    assert.ok(f.db.prepare("SELECT * FROM patients WHERE id='p-c'").get());
    assert.equal(await f.trash.restore('a', 'p-a'), false);
  } finally { f.db.close(); }
});

test('repeated trash does not restart 30-day deadline and codes stay reserved until permanent removal', async () => {
  const f = fixture();
  try {
    await f.trash.moveToTrash('a', 'p-a');
    const stamp = (await f.trash.list('a'))[0].deleted_at;
    f.advance(10 * 86400000);
    assert.equal(await f.trash.moveToTrash('a', 'p-a'), false);
    assert.equal((await f.trash.list('a'))[0].deleted_at, stamp);
    assert.throws(() => f.db.exec("INSERT INTO patients (id,owner_id,code,name,created_at,updated_at) VALUES ('duplicate','a','BN-01','New','now','now')"), /UNIQUE/);
    await f.trash.restore('a', 'p-a');
    assert.equal(await f.trash.restore('a', 'p-a'), false);
    assert.equal((await f.sessions.get('a', 'old')).notes, 'ghi chú phiên');
  } finally { f.db.close(); }
});
