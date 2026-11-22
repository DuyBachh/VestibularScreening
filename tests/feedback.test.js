import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeedbackMessage, feedbackErrors, FEEDBACK_LIMITS } from '../src/features/support/feedbackData.js';

const bug = { kind: 'bug', title: 'Không mở được PDF', description: 'Hiển thị lỗi sau khi bấm xem.', steps: '1. Mở Lịch sử\n2. Xem / in báo cáo', expected: 'Mở được báo cáo.' };

test('bug report requires title, description and reproducible steps while suggestions may omit steps', () => {
  assert.deepEqual(feedbackErrors(bug), {});
  assert.deepEqual(Object.keys(feedbackErrors({ ...bug, title: ' ', description: '\n', steps: '\t' })), ['title', 'description', 'steps']);
  assert.deepEqual(feedbackErrors({ ...bug, kind: 'suggestion', steps: '', expected: '' }), {});
  assert.throws(() => buildFeedbackMessage({ ...bug, kind: 'unknown' }), /Hãy chọn/);
});

test('oversized fields are rejected rather than silently dropping user feedback', () => {
  for (const [field, limit] of Object.entries(FEEDBACK_LIMITS)) {
    assert.equal(feedbackErrors({ ...bug, [field]: 'Đ'.repeat(limit) })[field], undefined);
    assert.ok(feedbackErrors({ ...bug, [field]: 'Đ'.repeat(limit + 1) })[field]);
    assert.throws(() => buildFeedbackMessage({ ...bug, [field]: 'Đ'.repeat(limit + 1) }));
  }
});

test('plain text report preserves Vietnamese, multiline steps and explicit expected result', () => {
  const text = buildFeedbackMessage(bug);
  for (const value of ['BÁO LỖI', bug.title, bug.description, bug.steps, bug.expected]) assert.ok(text.includes(value));
  assert.ok(!text.includes('Thông tin ứng dụng:'));
  const suggestion = buildFeedbackMessage({ ...bug, kind: 'suggestion', steps: '', expected: '' });
  assert.ok(suggestion.includes('GÓP Ý'));
  assert.ok(!suggestion.includes('Các bước thực hiện:'));
  assert.ok(!suggestion.includes('Kết quả mong đợi / đề xuất:'));
});

test('only reviewed environment fields are included, not arbitrary config or account data', () => {
  const env = { appVersion: '1.0.0', platform: 'ios', osVersion: '26.0', email: 'private@example.test', ownerId: 'secret-owner', token: 'secret-token', patients: ['private-patient'], extra: { key: 'secret-key' } };
  const text = buildFeedbackMessage(bug, env);
  assert.ok(text.includes('Phiên bản: 1.0.0'));
  assert.ok(text.includes('Hệ điều hành: iOS 26.0'));
  assert.doesNotMatch(text, /private@|secret-|private-patient/);
  assert.doesNotMatch(buildFeedbackMessage(bug, null), /1\.0\.0|26\.0|Thông tin ứng dụng/);
});

test('format normalizes line endings and control characters without mutating the draft', () => {
  const draft = { ...bug, title: '  Lỗi\r\n PDF  ', description: '  Tiếng Việt\r\nDòng 2\u0000  ' };
  const copy = { ...draft };
  const text = buildFeedbackMessage(draft);
  assert.ok(text.includes('Lỗi PDF'));
  assert.ok(text.includes('Tiếng Việt\nDòng 2'));
  assert.doesNotMatch(text, /\r|\u0000/);
  assert.deepEqual(draft, copy);
});

test('missing or malformed optional environment values are bounded and never serialized as objects', () => {
  const text = buildFeedbackMessage(bug, { platform: 'unknown', appVersion: 'V'.repeat(100), osVersion: { token: 'hidden' } });
  assert.ok(text.includes(`Phiên bản: ${'V'.repeat(40)}\n`));
  assert.ok(text.includes('Hệ điều hành: Khác Chưa xác định'));
  assert.doesNotMatch(text, /hidden|\[object Object\]/);
  assert.ok(buildFeedbackMessage(bug, { platform: 'android', osVersion: 36 }).includes('Android 36'));
});
