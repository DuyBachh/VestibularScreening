import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SESSION_SCHEMA } from '../src/features/tests/sessionData.js';
import { supportedTests } from '../src/features/tests/catalog.js';
import { createSessionRepository } from '../src/services/sessionRepository.js';
import { PENDING_RUN_SCHEMA, createPendingRunRepository } from '../src/services/pendingRunRepository.js';
import { BATTERY_SCHEMA, createBatteryRepository } from '../src/services/batteryRepository.js';
import { recordedBatteryCounts } from '../src/features/tests/batteryRecord.js';
import { buildBatteryReport } from '../src/features/tests/batteryReport.js';
import { setLanguage } from '../src/features/language/language.js';

function fixture(path = ':memory:', { failAt = '', lostAfter = '', failOrdinal = -1 } = {}) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON;CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,code TEXT,birth_date TEXT,gender TEXT,notes TEXT,deleted_at INTEGER);
    ${SESSION_SCHEMA} ${PENDING_RUN_SCHEMA} ${BATTERY_SCHEMA}
    INSERT OR IGNORE INTO patients VALUES('p-a','a','An <sample>','BN-A','2000-01-01','Nữ','',NULL),('p-b','b','Bình','BN-B','','Nam','',NULL);`);
  let current = true;
  const adapter = {
    runAsync: async (sql, args) => {
      if ((failAt && sql.includes(failAt)) || (sql.startsWith('INSERT INTO battery_items') && args[2] === failOrdinal)) throw new Error('Injected storage failure');
      const result = db.prepare(sql).run(...args);
      if (lostAfter && sql.includes(lostAfter)) current = false;
      return result;
    },
    getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null,
    getAllAsync: async (sql, args) => db.prepare(sql).all(...args),
    withExclusiveTransactionAsync: async (task) => {
      db.exec('BEGIN IMMEDIATE');
      try { await task(adapter); db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, repo: createBatteryRepository(async () => adapter), drafts: createPendingRunRepository(async () => adapter), sessions: createSessionRepository(async () => adapter), isCurrent: () => current };
}
async function create(f, id = 'batch', owner = 'a', patientId = 'p-a') { await f.repo.create(owner, { id, patientId, camera: false }, () => true); }
async function start(f, ordinal, id = 'batch', owner = 'a', patientId = 'p-a', sessionId = `session-${ordinal}`) {
  const run = { id: sessionId, patientId, testId: supportedTests[ordinal].id, startedAt: '2026-11-25T08:00:00Z', withCamera: false, batteryRef: { batteryId: id, ordinal } };
  await f.drafts.begin(owner, run, () => true); return run;
}
function result(run, saved = false, status = 'completed') { return { testId: run.testId, sessionId: run.id, status, elapsedMs: status === 'completed' ? 30000 : 5000, saved, cameraError: false }; }
async function save(f, run, notes = 'saved notes', status = 'completed') {
  await f.sessions.save('a', { ...run, endedAt: '2026-11-25T08:00:35Z', elapsedMs: status === 'completed' ? 30000 : 5000, status, cameraStatus: 'not_used', deletedSegments: 0 }, notes);
}

test('six runs persist under one ID, reopen in order and keep independent current notes', async () => {
  const f = fixture();
  try {
    await create(f);
    for (let i = 0; i < 6; i++) { const run = await start(f, i); await save(f, run, `note-${i}`); await f.repo.finish('a', 'batch', i, result(run, true), false, f.isCurrent); }
    let record = await f.repo.get('a', 'batch');
    assert.ok(record.ended_at); assert.equal(record.items.length, 6);
    assert.deepEqual(recordedBatteryCounts(record.items), { completed: 6, cancelled: 0, interrupted: 0, remaining: 0, saved: 6 });
    assert.deepEqual(record.items.map((item) => item.notes), supportedTests.map((_, i) => `note-${i}`));
    assert.equal((await f.repo.list('a'))[0].saved_count, 6);
    await f.sessions.updateNotes('a', 'session-2', 'updated later');
    record = await f.repo.get('a', 'batch'); assert.equal(record.items[2].notes, 'updated later');
    assert.equal((await f.sessions.list('a')).length, 6);
    assert.equal(await f.drafts.count('a'), 0);
  } finally { f.db.close(); }
});

test('early ending preserves six rows, distinguishes cancellation and does not retain discarded notes', async () => {
  const f = fixture();
  try {
    await create(f); const first = await start(f, 0); await save(f, first); await f.repo.finish('a', 'batch', 0, result(first, true), false, f.isCurrent);
    const second = await start(f, 1);
    await f.drafts.update('a', second.id, { elapsedMs: 5000, status: 'cancelled', endedAt: '2026-11-25T08:00:35Z', cameraStatus: 'not_used', deletedSegments: 0, notes: 'must disappear' }, 1);
    await f.drafts.remove('a', second.id); await f.repo.finish('a', 'batch', 1, result(second, false, 'cancelled'), true, f.isCurrent);
    const record = await f.repo.get('a', 'batch');
    assert.deepEqual(recordedBatteryCounts(record.items), { completed: 1, cancelled: 1, interrupted: 0, remaining: 4, saved: 1 });
    assert.equal(record.items[1].source, 'discarded'); assert.equal(record.items[1].notes, '');
    assert.ok(record.items.slice(2).every((item) => item.elapsedMs === null && item.source === 'none'));
    assert.doesNotMatch(buildBatteryReport(record), /must disappear/);
    await assert.rejects(start(f, 2), /Chuỗi đã thay đổi/);
    assert.equal(await f.drafts.get('a', 'session-2'), null);
  } finally { f.db.close(); }
});

test('kept drafts remain labelled unsaved and later recovery joins the same battery without duplication', async () => {
  const f = fixture();
  try {
    await create(f); const run = await start(f, 0);
    await f.drafts.update('a', run.id, { elapsedMs: 30000, status: 'completed', endedAt: '2026-11-25T08:00:35Z', cameraStatus: 'not_used', deletedSegments: 0, notes: 'draft only' }, 1);
    await f.repo.finish('a', 'batch', 0, result(run), true, f.isCurrent);
    let record = await f.repo.get('a', 'batch'); assert.equal(record.items[0].source, 'draft'); assert.equal(recordedBatteryCounts(record.items).saved, 0);
    await f.drafts.recover('a', run.id, 'recovered notes', f.isCurrent);
    record = await f.repo.get('a', 'batch'); assert.equal(record.items[0].source, 'saved'); assert.equal(record.items[0].notes, 'recovered notes');
    assert.equal(recordedBatteryCounts(record.items).saved, 1); assert.equal((await f.repo.list('a')).length, 1);
  } finally { f.db.close(); }
});

test('an active checkpoint stays interrupted even at 30 seconds and untouched exercises stay unperformed', async () => {
  const f = fixture();
  try {
    await create(f); const run = await start(f, 0);
    await f.drafts.update('a', run.id, { elapsedMs: 30000, status: 'active', endedAt: '', cameraStatus: 'not_used', deletedSegments: 0, notes: '' }, 1);
    const record = await f.repo.get('a', 'batch');
    assert.equal(record.ended_at, ''); assert.equal(record.items[0].status, 'interrupted');
    assert.deepEqual(recordedBatteryCounts(record.items), { completed: 0, cancelled: 0, interrupted: 1, remaining: 5, saved: 0 });
    await f.drafts.remove('a', run.id);
    assert.equal((await f.repo.get('a', 'batch')).items[0].source, 'missing');
    assert.equal((await f.repo.get('a', 'batch')).items[0].elapsedMs, null);
  } finally { f.db.close(); }
});

test('wrong owner/patient/order cannot bind a draft or claim another saved session', async () => {
  const f = fixture();
  try {
    await create(f); await create(f, 'batch-b', 'b', 'p-b');
    await assert.rejects(start(f, 1), /bài trước/);
    assert.equal(await f.drafts.count('a'), 0);
    await assert.rejects(start(f, 0, 'batch', 'b', 'p-b', 'foreign'), /Chuỗi đã thay đổi/);
    await assert.rejects(start(f, 0, 'batch', 'a', null), /Chuỗi đã thay đổi/);
    const run = await start(f, 0);
    await assert.rejects(f.repo.finish('a', 'batch', 0, result(run, true), false, f.isCurrent), /không khớp/);
    assert.equal(await f.repo.get('b', 'batch'), null);
    assert.equal((await f.repo.list('b')).length, 1);
    await assert.rejects(create(f, 'bad-patient', 'a', 'p-b'));
    await assert.rejects(f.repo.create('', { id: 'no-owner', patientId: null, camera: false }, f.isCurrent));
  } finally { f.db.close(); }
});

test('duplicate callbacks cannot add results or create new sessions; every new battery has six unperformed rows', async () => {
  const f = fixture();
  try {
    await create(f); let record = await f.repo.get('a', 'batch');
    assert.equal(recordedBatteryCounts(record.items).remaining, 6);
    const run = await start(f, 0); await save(f, run);
    await f.repo.finish('a', 'batch', 0, result(run, true), false, f.isCurrent);
    await f.repo.finish('a', 'batch', 0, result(run, true), false, f.isCurrent);
    record = await f.repo.get('a', 'batch'); assert.equal(recordedBatteryCounts(record.items).completed, 1);
    assert.equal((await f.sessions.list('a')).length, 1);
    await assert.rejects(start(f, 0));
  } finally { f.db.close(); }
});

test('trash hides batteries and blocks new runs; restore exposes them and hard delete cascades items', async () => {
  const f = fixture();
  try {
    await create(f); await create(f, 'unlinked', 'a', null);
    f.db.prepare("UPDATE patients SET deleted_at=1 WHERE id='p-a'").run();
    assert.equal(await f.repo.get('a', 'batch'), null); assert.equal((await f.repo.list('a')).length, 1);
    await assert.rejects(start(f, 0));
    f.db.prepare("UPDATE patients SET deleted_at=NULL WHERE id='p-a'").run(); assert.ok(await f.repo.get('a', 'batch'));
    f.db.prepare("DELETE FROM patients WHERE id='p-a'").run(); assert.equal(await f.repo.get('a', 'batch'), null);
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM battery_items WHERE battery_id='batch'").get().n, 0);
    assert.equal((await f.repo.get('a', 'unlinked')).items.length, 6);
  } finally { f.db.close(); }
});

test('creation, binding and finishing roll back on storage failure or account change', async () => {
  let f = fixture(':memory:', { failOrdinal: 3 });
  try { await assert.rejects(create(f)); assert.equal((await f.repo.list('a')).length, 0); assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM battery_items').get().n, 0); } finally { f.db.close(); }
  f = fixture(':memory:', { lostAfter: 'UPDATE battery_items SET session_id' });
  try {
    await create(f);
    await assert.rejects(f.drafts.begin('a', { id: 's', patientId: 'p-a', testId: 'smooth-pursuit', startedAt: '2026-11-25T08:00:00Z', withCamera: false, batteryRef: { batteryId: 'batch', ordinal: 0 } }, f.isCurrent));
    assert.equal(await f.drafts.count('a'), 0); assert.equal((await f.repo.get('a', 'batch')).items[0].status, 'not_performed');
  } finally { f.db.close(); }
  f = fixture(':memory:', { lostAfter: 'UPDATE battery_items SET phase=' });
  try {
    await create(f); const run = await start(f, 0);
    await assert.rejects(f.repo.finish('a', 'batch', 0, result(run), true, f.isCurrent));
    const record = await f.repo.get('a', 'batch'); assert.equal(record.ended_at, ''); assert.equal(record.items[0].status, 'interrupted');
  } finally { f.db.close(); }
});

test('records survive storage reopen, schema creation is repeatable and legacy sessions are not grouped', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'battery-db-')); const path = join(dir, 'test.db');
  try {
    let f = fixture(path); await create(f); const run = await start(f, 0); await save(f, run); await f.repo.finish('a', 'batch', 0, result(run, true), true, f.isCurrent); f.db.close();
    f = fixture(path);
    try { f.db.exec(BATTERY_SCHEMA); const record = await f.repo.get('a', 'batch'); assert.equal(record.items[0].notes, 'saved notes'); assert.equal(recordedBatteryCounts(record.items).saved, 1); assert.equal((await f.repo.list('a')).length, 1); } finally { f.db.close(); }
  } finally { unlinkSync(path); rmdirSync(dir); }
});

test('PDF contains all six names, explicit draft/cancelled/unused states and safe long notes in a locale snapshot', async () => {
  const f = fixture();
  try {
    await create(f); const run = await start(f, 0);
    const notes = '<script>bad</script>\n' + 'a'.repeat(950);
    await f.drafts.update('a', run.id, { status: 'cancelled', elapsedMs: 5000, endedAt: '2026-11-25T08:00:35Z', notes, cameraStatus: 'error', deletedSegments: 0 }, 1);
    await f.repo.finish('a', 'batch', 0, { ...result(run, false, 'cancelled'), cameraError: true }, true, f.isCurrent);
    const record = await f.repo.get('a', 'batch'); setLanguage('vi');
    const html = buildBatteryReport(record, { fullName: '<img src=https://bad>', workplace: 'Clinic & Lab', logoData: 'https://bad/logo.png' }, 'en', new Date('2026-11-25T10:00:00Z'));
    assert.match(html, /<html lang="en">/); assert.doesNotMatch(html, /<script>|<img src=https:|src="https:/);
    assert.match(html, /&lt;script&gt;/); assert.match(html, /a{950}/);
    assert.match(html, /Clinic &amp; Lab/); assert.match(html, /Draft|draft/); assert.match(html, /Cancelled/); assert.match(html, /Not attempted/);
    for (const exercise of supportedTests) assert.ok(html.includes(exercise.name));
    assert.match(html, /default-src 'none'/); assert.match(html, /overflow-wrap:anywhere/);
    assert.doesNotMatch(html, /Hoàn tất|Chưa thực hiện|Còn bản nháp/);
  } finally { setLanguage('vi'); f.db.close(); }
});
