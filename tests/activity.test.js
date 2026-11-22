import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ACTIVITY_SCHEMA, createActivityRepository } from '../src/services/activityRepository.js';
import { createSessionRepository } from '../src/services/sessionRepository.js';
import { createAccountDataRepository } from '../src/services/accountDataRepository.js';
import { SESSION_SCHEMA } from '../src/features/tests/sessionData.js';
import { BRANDING_SCHEMA } from '../src/features/auth/reportBranding.js';
import { activityLabel } from '../src/features/activity/activityLabels.js';
import { setLanguage } from '../src/features/language/language.js';

function fixture(path = ':memory:', migrate = true) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,code TEXT NOT NULL,name TEXT NOT NULL,birth_date TEXT DEFAULT '',gender TEXT DEFAULT '',notes TEXT DEFAULT '',deleted_at INTEGER,updated_at TEXT,UNIQUE(owner_id,code));
    ${SESSION_SCHEMA} ${BRANDING_SCHEMA}`);
  if (migrate) db.exec(ACTIVITY_SCHEMA);
  const adapter = {
    runAsync: async (sql, args) => db.prepare(sql).run(...args),
    getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null,
    getAllAsync: async (sql, args) => db.prepare(sql).all(...args),
    withExclusiveTransactionAsync: async (task) => {
      db.exec('BEGIN IMMEDIATE');
      try { await task(adapter); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  const getDatabase = async () => adapter;
  return { db, repo: createActivityRepository(getDatabase), sessions: createSessionRepository(getDatabase), account: createAccountDataRepository(getDatabase) };
}
function patient(db, id = 'p-1', owner = 'a') {
  db.prepare('INSERT INTO patients(id,owner_id,code,name,notes) VALUES(?,?,?,?,?)').run(id, owner, id, 'Private patient name', 'Secret patient notes');
}
function draft(id = 's-1', patientId = 'p-1') { return { id, patientId, testId: 'smooth-pursuit', startedAt: '2026-11-18T08:00:00Z', endedAt: '2026-11-18T08:00:35Z', elapsedMs: 30000, status: 'completed', cameraStatus: 'not_used', deletedSegments: 0 }; }

test('patient triggers log real changes in order without storing names or notes', async () => {
  const { db, repo } = fixture();
  try {
    patient(db);
    db.prepare("UPDATE patients SET name='Changed private name' WHERE id='p-1'").run();
    db.prepare("UPDATE patients SET updated_at='timestamp-only' WHERE id='p-1'").run();
    db.prepare("UPDATE patients SET deleted_at=1 WHERE id='p-1'").run();
    db.prepare("UPDATE patients SET deleted_at=NULL WHERE id='p-1'").run();
    db.prepare("DELETE FROM patients WHERE id='p-1'").run();
    const events = await repo.list('a');
    assert.deepEqual(events.map((item) => item.event), ['patient_deleted','patient_restored','patient_trashed','patient_updated','patient_created']);
    assert.doesNotMatch(JSON.stringify(events), /Private|Secret|Changed/);
    assert.deepEqual(Object.keys(events[0]).sort(), ['id','owner_id','event','category','target_id','occurred_at'].sort());
    for (const row of events) assert.ok(Number.isFinite(Date.parse(row.occurred_at)));
  } finally { db.close(); }
});

test('failed mutations and rolled-back changes cannot leave success events', async () => {
  const { db, repo } = fixture();
  try {
    patient(db);
    assert.throws(() => patient(db), /UNIQUE/);
    db.exec('BEGIN'); patient(db, 'rolled-back'); db.exec('ROLLBACK');
    db.exec("CREATE TRIGGER fail_activity BEFORE INSERT ON activity_events BEGIN SELECT RAISE(ABORT,'log unavailable'); END;");
    assert.throws(() => patient(db, 'no-log'), /log unavailable/);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM patients WHERE id IN ('rolled-back','no-log')").get().n, 0);
    assert.equal((await repo.list('a')).length, 1);
  } finally { db.close(); }
});

test('session save retries and unchanged notes do not duplicate events; foreign-owner writes fail', async () => {
  const { db, repo, sessions } = fixture();
  try {
    patient(db);
    await sessions.save('a', draft(), 'Sensitive session notes');
    await sessions.save('a', draft(), 'Retry notes');
    await sessions.updateNotes('a', 's-1', 'Sensitive session notes');
    await sessions.updateNotes('a', 's-1', 'Edited private notes');
    await assert.rejects(sessions.save('b', draft('foreign'), 'bad'));
    await assert.rejects(sessions.updateNotes('b', 's-1', 'bad'));
    const rows = await repo.list('a', { category: 'session' });
    assert.deepEqual(rows.map((row) => row.event), ['session_notes_updated','session_saved']);
    assert.doesNotMatch(JSON.stringify(rows), /Sensitive|Edited|notes content/);
    assert.equal((await repo.list('b')).length, 0);
  } finally { db.close(); }
});

test('keyset paging and category filters isolate owners and do not duplicate after a new event', async () => {
  const { db, repo } = fixture();
  try {
    for (let index = 0; index < 65; index++) patient(db, `p-${index}`);
    patient(db, 'other', 'b');
    const first = await repo.list('a');
    patient(db, 'newest');
    const second = await repo.list('a', { beforeId: first.at(-1).id });
    const last = await repo.list('a', { beforeId: second.at(-1).id });
    assert.equal(first.length, 30); assert.equal(second.length, 30); assert.equal(last.length, 5);
    assert.equal(new Set([...first,...second,...last].map((item) => item.id)).size, 65);
    assert.equal((await repo.list('a', { category: 'report' })).length, 0);
    assert.equal((await repo.list('b')).length, 1);
    await assert.rejects(repo.list('a', { category: "patient' OR 1=1" }));
    await assert.rejects(repo.list('a', { beforeId: -1 }));
    await assert.rejects(repo.list(''));
  } finally { db.close(); }
});

test('report events require an active owned session and reject arbitrary event payloads', async () => {
  const { db, repo, sessions } = fixture();
  try {
    patient(db);
    await sessions.save('a', draft(), 'private');
    for (const event of ['pdf_preview_requested','pdf_created','pdf_share_requested']) await repo.appendReport('a', event, 's-1');
    await assert.rejects(repo.appendReport('b', 'pdf_created', 's-1'));
    await assert.rejects(repo.appendReport('a', 'patient_created', 's-1'));
    await assert.rejects(repo.appendReport('a', 'pdf_created', 'name@email.com'));
    db.exec("UPDATE patients SET deleted_at=1 WHERE id='p-1'");
    await assert.rejects(repo.appendReport('a', 'pdf_created', 's-1'));
    assert.equal((await repo.list('a', { category: 'report' })).length, 3);
    await sessions.save('a', draft('unlinked', null), '');
    await repo.appendReport('a', 'pdf_created', 'unlinked');
    assert.equal((await repo.list('a', { category: 'report' })).length, 4);
  } finally { db.close(); }
});

test('migration does not invent old events and remains repeatable after reopening the database', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'vestibular-activity-'));
  const file = join(directory, 'test.db');
  let f = fixture(file, false);
  try {
    patient(f.db, 'old');
    f.db.exec(ACTIVITY_SCHEMA);
    assert.equal((await f.repo.list('a')).length, 0);
    patient(f.db, 'new');
    f.db.close(); f = fixture(file);
    f.db.exec(ACTIVITY_SCHEMA);
    f.db.exec("UPDATE patients SET notes='edited' WHERE id='new'");
    assert.deepEqual((await f.repo.list('a')).map((row) => row.event), ['patient_updated','patient_created']);
    assert.equal(f.db.prepare("SELECT name FROM patients WHERE id='old'").get().name, 'Private patient name');
  } finally { f.db.close(); unlinkSync(file); rmdirSync(directory); }
});

test('clearing account data removes trigger-generated events last and preserves the other account', async () => {
  const { db, repo, sessions, account } = fixture();
  try {
    patient(db); patient(db, 'p-b', 'b');
    await sessions.save('a', draft(), 'private');
    await account.clear('a', () => true);
    assert.equal((await repo.list('a')).length, 0);
    assert.equal((await repo.list('b')).length, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM patients WHERE owner_id='a'").get().n, 0);
  } finally { db.close(); }
});

test('activity labels switch language without changing stored event codes', () => {
  try {
    setLanguage('en');
    for (const event of ['patient_created','patient_updated','patient_trashed','patient_restored','patient_deleted','session_saved','session_notes_updated','pdf_preview_requested','pdf_created','pdf_share_requested']) assert.doesNotMatch(activityLabel(event), /[À-ỹ]/);
    assert.equal(activityLabel('pdf_share_requested'), 'Requested PDF sharing');
    setLanguage('vi');
    assert.equal(activityLabel('pdf_share_requested'), 'Yêu cầu chia sẻ PDF');
  } finally { setLanguage('vi'); }
});
