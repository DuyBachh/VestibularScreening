import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createAccountDataRepository } from '../src/services/accountDataRepository.js';
import { BRANDING_SCHEMA } from '../src/features/auth/reportBranding.js';
import { ACTIVITY_TABLE_SCHEMA } from '../src/services/activityRepository.js';
import { PENDING_RUN_SCHEMA } from '../src/services/pendingRunRepository.js';

function fixture({ failAt = '', loseAfter = '' } = {}) {
  const db = new DatabaseSync(':memory:');
  // Exclusive Expo transactions use a separate connection without inherited foreign_keys.
  // Explicit deletes must therefore remove every owned session, without relying on cascade.
  db.exec(`PRAGMA foreign_keys = OFF;
    CREATE TABLE patients (id TEXT PRIMARY KEY, owner_id TEXT, deleted_at INTEGER);
    CREATE UNIQUE INDEX patients_owner_id ON patients(owner_id,id);
    CREATE TABLE test_sessions (id TEXT PRIMARY KEY, owner_id TEXT, patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE, notes TEXT);
    ${PENDING_RUN_SCHEMA}
    ${BRANDING_SCHEMA}
    ${ACTIVITY_TABLE_SCHEMA}
    INSERT INTO patients VALUES ('a-active','a',NULL),('a-trash','a',1),('b-active','b',NULL),('b-trash','b',1);
    INSERT INTO test_sessions VALUES ('a-1','a','a-active','active note'),('a-2','a','a-trash','trash note'),('a-3','a',NULL,'unlinked note'),('b-1','b','b-active','other note');
    INSERT INTO report_branding VALUES ('a','logo-a','now'),('b','logo-b','now');
    INSERT INTO pending_runs(id,owner_id,patient_id,test_id,started_at,updated_at,camera_status) VALUES ('draft-a','a',NULL,'smooth-pursuit','now','now','not_used'),('draft-b','b',NULL,'okn','now','now','not_used');
    INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES('a','patient_created','patient','a-active','now'),('b','patient_created','patient','b-active','now');`);
  let current = true;
  const adapter = {
    getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null,
    withExclusiveTransactionAsync: async (task) => {
      db.exec('BEGIN IMMEDIATE');
      try {
        await task({ runAsync: async (sql, args) => {
          if (failAt && sql.includes(failAt)) throw new Error('Injected storage failure');
          const result = db.prepare(sql).run(...args);
          if (loseAfter && sql.includes(loseAfter)) current = false;
          return result;
        } });
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, repo: createAccountDataRepository(async () => adapter), isCurrent: () => current };
}

test('summary counts only current owner, including trash and unlinked sessions', async () => {
  const f = fixture();
  try {
    assert.deepEqual({ ...await f.repo.summary('a') }, { patients: 1, trashed: 1, sessions: 3, logos: 1, drafts: 1 });
    assert.deepEqual({ ...await f.repo.summary('empty') }, { patients: 0, trashed: 0, sessions: 0, logos: 0, drafts: 0 });
    await assert.rejects(f.repo.summary(''));
  } finally { f.db.close(); }
});

test('confirmed removal clears all owned data and preserves other accounts; repeated removal is safe', async () => {
  const f = fixture();
  try {
    await f.repo.clear('a', f.isCurrent);
    assert.deepEqual({ ...await f.repo.summary('a') }, { patients: 0, trashed: 0, sessions: 0, logos: 0, drafts: 0 });
    assert.deepEqual({ ...await f.repo.summary('b') }, { patients: 1, trashed: 1, sessions: 1, logos: 1, drafts: 1 });
    assert.equal(f.db.prepare("SELECT notes FROM test_sessions WHERE id='b-1'").get().notes, 'other note');
    assert.equal(f.db.prepare("SELECT logo_data FROM report_branding WHERE owner_id='b'").get().logo_data, 'logo-b');
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM activity_events WHERE owner_id='a'").get().n, 0);
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM activity_events WHERE owner_id='b'").get().n, 1);
    assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length, 0);
    await f.repo.clear('a', f.isCurrent);
    assert.equal((await f.repo.summary('b')).patients, 1);
  } finally { f.db.close(); }
});

test('storage failures roll back sessions, patients and logo together', async () => {
  for (const failAt of ['pending_runs', 'patients', 'report_branding', 'activity_events']) {
    const f = fixture({ failAt });
    try {
      await assert.rejects(f.repo.clear('a', f.isCurrent));
      assert.deepEqual({ ...await f.repo.summary('a') }, { patients: 1, trashed: 1, sessions: 3, logos: 1, drafts: 1 });
      assert.equal(f.db.prepare("SELECT notes FROM test_sessions WHERE id='a-2'").get().notes, 'trash note');
      assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM activity_events WHERE owner_id='a'").get().n, 1);
    } finally { f.db.close(); }
  }
});

test('account change before or during deletion prevents partial cleanup', async () => {
  for (const loseAfter of ['', 'pending_runs', 'test_sessions', 'patients', 'report_branding', 'activity_events']) {
    const f = fixture({ loseAfter });
    try {
      await assert.rejects(f.repo.clear('a', loseAfter ? f.isCurrent : () => false));
      assert.deepEqual({ ...await f.repo.summary('a') }, { patients: 1, trashed: 1, sessions: 3, logos: 1, drafts: 1 });
    } finally { f.db.close(); }
  }
});

test('missing owner is rejected before opening a database', async () => {
  const repo = createAccountDataRepository(async () => { throw new Error('Database should not open'); });
  await assert.rejects(repo.clear('', () => true), /Cần đăng nhập/);
  await assert.rejects(repo.summary('  '), /Cần đăng nhập/);
});
