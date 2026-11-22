import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { english } from '../src/features/language/english.js';
import { t, getLanguage, getLocale, setLanguage, subscribeLanguage, genderLabel } from '../src/features/language/language.js';
import { languagePreference, LANGUAGE_KEY } from '../src/features/language/languagePreference.js';
import { GENDERS, validatePatient } from '../src/features/patients/patientValidation.js';
import { supportedTests } from '../src/features/tests/catalog.js';
import { testPresentation } from '../src/features/tests/testPresentation.js';
import { getGuideCategories } from '../src/features/guide/guideTopics.js';
import { buildSessionReport } from '../src/features/tests/sessionReport.js';

test('language preference survives a new adapter without reading or writing account data', async () => {
  const data = new Map([['account-token', 'untouched']]);
  const storage = { getItem: async (key) => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } };
  assert.equal(await languagePreference(storage).load(), 'vi');
  await languagePreference(storage).save('en');
  assert.equal(await languagePreference(storage).load(), 'en');
  assert.equal(data.get('account-token'), 'untouched');
  assert.equal(data.get(LANGUAGE_KEY), 'en');
  data.set(LANGUAGE_KEY, 'unknown');
  assert.equal(await languagePreference(storage).load(), 'vi');
});

test('failed or unsupported language writes keep the previous stored choice', async () => {
  let value = 'vi';
  const preference = languagePreference({ getItem: async () => value, setItem: async () => { throw new Error('disk'); } });
  await assert.rejects(preference.save('en'), /disk/);
  await assert.rejects(preference.save('unsupported'), /Unsupported/);
  assert.equal(value, 'vi');
  assert.equal(await preference.load(), 'vi');
});

test('language subscribers update once per actual change and can unsubscribe', () => {
  setLanguage('vi'); let count = 0;
  const unsubscribe = subscribeLanguage(() => count++);
  try {
    setLanguage('en'); setLanguage('en');
    assert.equal(count, 1);
    assert.equal(getLanguage(), 'en');
    assert.equal(getLocale(), 'en-US');
    unsubscribe(); setLanguage('vi');
    assert.equal(count, 1);
  } finally { unsubscribe(); setLanguage('vi'); }
});

test('translation preserves user values, whitespace and placeholder-looking input', () => {
  assert.equal(t('Chọn bài {0}', ['Đăng nhập'], 'en'), 'Choose exercise Đăng nhập');
  assert.equal(t('Chọn bài {0}', ['{1}'], 'en'), 'Choose exercise {1}');
  assert.equal(t('  Đăng nhập  ', [], 'en'), '  Sign in  ');
  assert.equal(t(' \n '), ' \n ');
  assert.equal(t('Private note <keep>', [], 'en'), 'Private note <keep>');
  assert.equal(t('Đăng nhập', [], 'vi'), 'Đăng nhập');
});

test('all six exercise instructions and guide topics switch without changing IDs or source data', () => {
  setLanguage('vi');
  const ids = supportedTests.map((item) => item.id);
  const original = testPresentation('anti-saccade').title;
  try {
    setLanguage('en');
    for (const exercise of supportedTests) assert.doesNotMatch(testPresentation(exercise.id).title, /[À-ỹ]/);
    assert.equal(getGuideCategories()[0].label, 'Get started');
    assert.deepEqual(supportedTests.map((item) => item.id), ids);
    setLanguage('vi');
    assert.equal(testPresentation('anti-saccade').title, original);
    assert.equal(getGuideCategories()[0].label, 'Bắt đầu');
  } finally { setLanguage('vi'); }
});

test('English labels leave the two stored sex values, names and notes intact', () => {
  const form = { name: 'Trang chủ', code: 'BN-01', birthDate: '2000-01-01', gender: 'Nữ', notes: 'Đăng nhập' };
  const before = structuredClone(form);
  try {
    setLanguage('en');
    assert.deepEqual(GENDERS, ['Nam', 'Nữ']);
    assert.equal(genderLabel('Nữ'), 'Female');
    assert.equal(genderLabel('Nam'), 'Male');
    assert.equal(validatePatient(form), '');
    assert.equal(validatePatient({ ...form, gender: 'Female' }), 'Select Male or Female.');
    assert.deepEqual(form, before);
  } finally { setLanguage('vi'); }
});

test('English PDF translates authored labels but preserves and escapes all user content', () => {
  const session = { id: 's', patient_id: 'p', patient_name: 'Trang chủ', patient_code: 'BN-01', test_id: 'okn', started_at: '2026-11-18T08:00:00Z', ended_at: '2026-11-18T08:00:35Z', elapsed_ms: 30000, status: 'completed', camera_status: 'deleted', deleted_segments: 2, notes: 'Đăng nhập <mẫu>' };
  const patient = { id: 'p', gender: 'Nữ', birth_date: '2000-01-01' };
  const before = structuredClone({ session, patient });
  const en = buildSessionReport(session, patient, new Date(session.ended_at), { fullName: 'Họ và tên' }, 'en');
  assert.match(en, /<html lang="en">/);
  for (const value of ['Exercise session report', 'Patient record', 'LEARNING SIMULATION - NOT FOR DIAGNOSIS', 'Recorded and deleted 2 temporary video segments.', '>Female<', '>Trang chủ<', 'Đăng nhập &lt;mẫu&gt;', '>Họ và tên<', 'Optokinetic Nystagmus']) assert.ok(en.includes(value), value);
  assert.deepEqual({ session, patient }, before);
  try {
    setLanguage('en');
    const vi = buildSessionReport(session, patient);
    assert.match(vi, /<html lang="vi">/);
    assert.ok(vi.includes('Báo cáo lượt kiểm tra'));
    assert.ok(vi.includes('>Nữ<'));
  } finally { setLanguage('vi'); }
});

test('all authored translation calls have English entries with matching interpolation slots', () => {
  const missing = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.[jt]sx?$/.test(file) && !file.endsWith('english.js')) {
        const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS);
        function visit(node) {
          if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
            const key = node.arguments[0].text.trim();
            if (!Object.hasOwn(english, key)) missing.push(`${file}: ${key}`);
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
  }
  walk('src');
  assert.deepEqual(missing, []);
  for (const [source, translated] of Object.entries(english)) {
    assert.deepEqual((translated.match(/\{\d+\}/g) || []).sort(), (source.match(/\{\d+\}/g) || []).sort(), source);
  }
});
