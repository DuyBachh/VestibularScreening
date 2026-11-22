import assert from 'node:assert/strict';
import test from 'node:test';
import { shareGeneratedPdf } from '../src/features/tests/reportSharingFlow.js';

const nativeUri = 'file:///var/mobile/Containers/Data/Application/EXPO/Library/Caches/ExponentExperienceData/%2540user%252Fapp/Print/report.pdf';
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('shares exact original Print URI without moving, decoding or reconstructing it', async () => {
  const events = [];
  await shareGeneratedPdf({ create: async () => ({ uri: nativeUri }), isCurrent: () => true,
    share: async (uri) => events.push(['share', uri]), remove: (uri) => events.push(['remove', uri]) });
  assert.deepEqual(events, [['share', nativeUri], ['remove', nativeUri]]);
});

test('does not delete PDF until share sheet has finished with the file', async () => {
  let resolveShare;
  const dismissed = new Promise((resolve) => { resolveShare = resolve; });
  let deleted = false;
  const operation = shareGeneratedPdf({ create: async () => ({ uri: nativeUri }), isCurrent: () => true,
    share: async () => dismissed, remove: () => { deleted = true; } });
  await flush();
  assert.equal(deleted, false);
  resolveShare();
  await operation;
  assert.equal(deleted, true);
});

test('share permission rejection still deletes original PDF and keeps the original error', async () => {
  const failure = new Error('FilePermissionException');
  let removed = '';
  await assert.rejects(shareGeneratedPdf({ create: async () => ({ uri: nativeUri }), isCurrent: () => true,
    share: async () => { throw failure; }, remove: (uri) => { removed = uri; } }), (error) => error === failure);
  assert.equal(removed, nativeUri);
});

test('leaving screen during generation cleans output without opening sharing', async () => {
  let current = true;
  let shared = false;
  let removed = '';
  await shareGeneratedPdf({ create: async () => { current = false; return { uri: nativeUri }; }, isCurrent: () => current,
    share: async () => { shared = true; }, remove: (uri) => { removed = uri; } });
  assert.equal(shared, false);
  assert.equal(removed, nativeUri);
});

test('missing output URI cannot be reported as a completed share', async () => {
  let shared = false;
  await assert.rejects(shareGeneratedPdf({ create: async () => ({ uri: '' }), isCurrent: () => true,
    share: async () => { shared = true; }, remove: () => {} }), /Không tạo được file PDF/);
  assert.equal(shared, false);
});
