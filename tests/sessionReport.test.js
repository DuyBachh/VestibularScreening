import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSessionReport, isPrintCancellation } from '../src/features/tests/sessionReport.js';

const session = { id: 's_test', patient_id: 'p_test', patient_name: 'Nguyễn An', patient_code: 'BN-01',
  test_id: 'smooth-pursuit', started_at: '2026-11-10T08:00:00.000Z', ended_at: '2026-11-10T08:00:35.000Z',
  elapsed_ms: 30000, status: 'completed', camera_status: 'deleted', deleted_segments: 2, notes: 'Ghi chú tiếng Việt\nDòng thứ hai.' };
const patient = { id: 'p_test', code: 'BN-01', name: 'Nguyễn An', birth_date: '2000-02-29', gender: 'Nam', notes: '', created_at: '', updated_at: '' };
const now = new Date('2026-11-10T09:00:00Z');

test('vertical report names the correct exercise and preserves actual duration and notes', () => {
  const html = buildSessionReport({ ...session, test_id: 'vertical-saccades', notes: 'Dọc <mẫu>' }, patient, now);
  assert.ok(html.includes('Vertical Saccades'));
  assert.ok(html.includes('Dọc &lt;mẫu&gt;'));
  assert.ok(!html.includes('Horizontal Saccades'));
});

test('anti-saccade report preserves its name and notes for a cancelled run', () => {
  const html = buildSessionReport({ ...session, test_id: 'anti-saccade', status: 'cancelled', elapsed_ms: 5000, notes: 'Đối diện <mẫu>' }, patient, now);
  assert.ok(html.includes('Anti-Saccade'));
  assert.ok(html.includes('Đối diện &lt;mẫu&gt;'));
  assert.ok(!html.includes('Horizontal Saccades'));
});

test('gaze-evoked report preserves the exercise identity and notes without an anti-saccade label', () => {
  const html = buildSessionReport({ ...session, test_id: 'gaze-evoked', notes: 'Giữ mắt <mẫu>' }, patient, now);
  assert.ok(html.includes('Gaze-Evoked Nystagmus'));
  assert.ok(html.includes('Giữ mắt &lt;mẫu&gt;'));
  assert.ok(!html.includes('Anti-Saccade'));
});

test('OKN report keeps its exercise name and notes for a cancelled run', () => {
  const html = buildSessionReport({ ...session, test_id: 'okn', status: 'cancelled', elapsed_ms: 9000, notes: 'Dải <mẫu>' }, patient, now);
  assert.ok(html.includes('Optokinetic Nystagmus'));
  assert.ok(html.includes('Dải &lt;mẫu&gt;'));
  assert.ok(!html.includes('Gaze-Evoked Nystagmus'));
});

test('report embeds local logo and escapes current clinician details with safe fallbacks', () => {
  const logoData = 'data:image/png;base64,iVBORw0KGgo=';
  const html = buildSessionReport(session, patient, now, { fullName: '<script>test</script>', specialty: 'Tai mũi họng', workplace: 'A & B', logoData });
  assert.ok(html.includes(`src="${logoData}"`));
  assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'));
  assert.ok(html.includes('Tai mũi họng'));
  assert.ok(html.includes('A &amp; B'));
  assert.doesNotMatch(html, /<script/i);
  for (const logoData of ['https://evil.test/a', 'data:image/svg+xml;base64,YWJj', 'x" onerror="alert(1)']) {
    const safe = buildSessionReport(session, patient, now, { logoData });
    assert.doesNotMatch(safe, /<img|onerror=/i);
    assert.ok(safe.includes('Chưa cung cấp'));
  }
});

test('closing native print preview is recognized while real printer errors stay failures', () => {
  assert.equal(isPrintCancellation({ code: 'ERR_PRINT_INCOMPLETE' }), true);
  assert.equal(isPrintCancellation(new Error('Printing did not complete')), true);
  assert.equal(isPrintCancellation({ code: 'ERR_PRINTING_JOB_FAILED', message: 'Printer unavailable' }), false);
  assert.equal(isPrintCancellation(null), false);
});

test('report includes real metadata, Vietnamese, multiline notes and nonclinical label', () => {
  const html = buildSessionReport(session, patient, now);
  for (const text of ['Nguyễn An', 'BN-01', '29/02/2000', 'Nam', 'Smooth Pursuit', '30 giây', '2 đoạn', 'Ghi chú tiếng Việt\nDòng thứ hai.', 'KHÔNG DÙNG CHẨN ĐOÁN']) assert.ok(html.includes(text), text);
  assert.match(html, /charset="utf-8"/);
  assert.match(html, /white-space: pre-wrap/);
  assert.doesNotMatch(html, /<script|<img|https?:\/\//i);
});

test('patient and notes HTML is escaped and cannot add markup or remote resources', () => {
  const input = '</div><img src="https://evil.test/?x=1&y=2"><script>alert(1)</script>';
  const html = buildSessionReport({ ...session, patient_name: input, patient_code: "A'B", notes: input }, patient, now);
  assert.doesNotMatch(html, /<img|<script/i);
  assert.ok(html.includes('&lt;img src=&quot;https://evil.test/?x=1&amp;y=2&quot;&gt;'));
  assert.ok(html.includes('A&#39;B'));
  assert.ok(html.includes("default-src 'none'"));
});

test('cancelled and camera errors stay explicit instead of implying successful recording', () => {
  const html = buildSessionReport({ ...session, status: 'cancelled', elapsed_ms: 5000, camera_status: 'error', deleted_segments: 0 }, patient, now);
  assert.ok(html.includes('Đã hủy'));
  assert.ok(html.includes('5 giây'));
  assert.ok(html.includes('Có lỗi ghi hoặc xóa camera'));
  assert.ok(html.includes('Không xác nhận ghi hình thành công'));
  assert.ok(!html.includes('Đã ghi và xóa'));
});

test('unlinked session has no phantom patient details and missing notes remain explicit', () => {
  const html = buildSessionReport({ ...session, patient_id: null, patient_name: null, patient_code: null, notes: '', camera_status: 'not_used' }, null, now);
  for (const text of ['Không gắn hồ sơ', 'Không có ghi chú.', 'Không ghi video trong lượt này.']) assert.ok(html.includes(text));
  assert.ok(!html.includes('Ngày sinh'));
});

test('long unbroken notes remain intact with wrapping and no fixed-height clipping', () => {
  const notes = 'Đ'.repeat(1000);
  const html = buildSessionReport({ ...session, notes }, patient, now);
  assert.ok(html.includes(notes));
  assert.match(html, /overflow-wrap: anywhere/);
  assert.doesNotMatch(html, /overflow:\s*hidden|max-height/);
});
