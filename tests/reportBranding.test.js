import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { BRANDING_SCHEMA, isReportLogo, MAX_LOGO_LENGTH, normalizeReportBranding } from '../src/features/auth/reportBranding.js';
import { createBrandingRepository } from '../src/services/brandingRepository.js';

const logo = 'data:image/png;base64,iVBORw0KGgo=';
test('branding migration is additive and logos remain isolated through replacement and removal', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE patients (id TEXT); INSERT INTO patients VALUES ('preserved'); PRAGMA user_version = 4;`);
    db.exec(`BEGIN; ${BRANDING_SCHEMA} PRAGMA user_version = 5; COMMIT;`);
    assert.equal(db.prepare('SELECT id FROM patients').get().id, 'preserved');
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 5);
    const repo = createBrandingRepository(async () => ({
      getFirstAsync: async (sql, args) => db.prepare(sql).get(...args) || null,
      runAsync: async (sql, args) => db.prepare(sql).run(...args),
    }));
    assert.equal(await repo.getLogo('a'), '');
    await repo.setLogo('a', logo);
    await repo.setLogo('b', logo);
    await repo.setLogo('a', 'data:image/jpeg;base64,YWJj');
    assert.equal(await repo.getLogo('a'), 'data:image/jpeg;base64,YWJj');
    assert.equal(await repo.getLogo('b'), logo);
    await repo.removeLogo('a');
    assert.equal(await repo.getLogo('a'), '');
    assert.equal(await repo.getLogo('b'), logo);
    await assert.rejects(repo.setLogo('b', 'https://example.test/logo.png'));
    await assert.rejects(repo.removeLogo(''));
    assert.equal(await repo.getLogo('b'), logo);
  } finally { db.close(); }
});
test('report accepts bounded raster data only and normalizes saved clinician fields', () => {
  assert.equal(isReportLogo(logo), true);
  for (const value of ['', null, 'https://example.test/logo.png', 'data:image/svg+xml;base64,YWJj', `${logo}" onerror="alert(1)`, `data:image/png;base64,${'A'.repeat(MAX_LOGO_LENGTH)}`]) assert.equal(isReportLogo(value), false);
  assert.deepEqual(normalizeReportBranding({ fullName: '  Nguyễn An  ', specialty: 'A'.repeat(130), workplace: '', logoData: 'file:///private/logo.png' }), { fullName: 'Nguyễn An', specialty: 'A'.repeat(120), workplace: '', logoData: '' });
});
