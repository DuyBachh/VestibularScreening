import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordingController } from '../src/features/tests/recordingController.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

function fixture(remove = async () => {}) {
  const recordings = [];
  const errors = [];
  const deleted = [];
  const states = [];
  let stops = 0;
  const camera = { recordAsync: () => { const pending = deferred(); recordings.push(pending); return pending.promise; }, stopRecording: () => stops++ };
  const controller = createRecordingController({ getCamera: () => camera,
    remove: async (uri) => { deleted.push(uri); await remove(uri); },
    onBusy: (busy) => states.push(busy), onError: (message) => errors.push(message), onDeleted: () => {},
  });
  return { controller, recordings, errors, deleted, states, stops: () => stops };
}

test('rapid stop/resume waits for old native result and deletion before new recording', async () => {
  const deletion = deferred();
  const f = fixture(() => deletion.promise);
  f.controller.setActive(true);
  f.controller.setActive(true);
  f.controller.setActive(false);
  f.controller.setActive(true);
  assert.equal(f.recordings.length, 1);
  assert.equal(f.stops(), 1);
  f.recordings[0].resolve({ uri: 'old.mp4' });
  await flush();
  assert.equal(f.recordings.length, 1);
  deletion.resolve();
  await flush();
  assert.equal(f.recordings.length, 2);
  assert.deepEqual(f.deleted, ['old.mp4']);
  assert.deepEqual(f.errors, []);
  f.controller.dispose();
  f.recordings[1].resolve({ uri: 'new.mp4' });
  await flush();
  assert.deepEqual(f.deleted, ['old.mp4', 'new.mp4']);
});

test('late video after unmount is deleted without notifying disposed UI', async () => {
  const f = fixture();
  f.controller.setActive(true);
  f.controller.dispose();
  f.recordings[0].resolve({ uri: 'late.mp4' });
  await flush();
  assert.deepEqual(f.deleted, ['late.mp4']);
  assert.deepEqual(f.states, [true]);
  assert.deepEqual(f.errors, []);
});

test('deletion failure pauses controller and retries file before recording again', async () => {
  let failing = true;
  const f = fixture(async () => { if (failing) throw new Error('disk error'); });
  f.controller.setActive(true);
  f.controller.setActive(false);
  f.recordings[0].resolve({ uri: 'pending.mp4' });
  await flush();
  assert.equal(f.errors.length, 1);
  assert.equal(f.recordings.length, 1);
  failing = false;
  f.controller.setActive(true);
  await flush();
  assert.deepEqual(f.deleted, ['pending.mp4', 'pending.mp4']);
  assert.equal(f.recordings.length, 2);
  f.controller.dispose();
  f.recordings[1].resolve({ uri: 'last.mp4' });
  await flush();
});

test('unexpected native completion reports failure instead of looping records', async () => {
  const f = fixture();
  f.controller.setActive(true);
  f.recordings[0].resolve({ uri: 'early.mp4' });
  await flush();
  assert.equal(f.errors.length, 1);
  assert.equal(f.recordings.length, 1);
  assert.deepEqual(f.deleted, ['early.mp4']);
});

test('native rejection releases busy state and allows explicit retry', async () => {
  const f = fixture();
  f.controller.setActive(true);
  f.recordings[0].reject(new Error('permission revoked'));
  await flush();
  assert.deepEqual(f.states, [true, false]);
  assert.equal(f.errors.length, 1);
  f.controller.setActive(true);
  assert.equal(f.recordings.length, 2);
  f.controller.dispose();
  f.recordings[1].resolve(undefined);
  await flush();
});

test('normal stop holds busy until native video is finalized and deleted', async () => {
  const deletion = deferred();
  const f = fixture(() => deletion.promise);
  f.controller.setActive(true);
  f.controller.setActive(false);
  assert.equal(f.stops(), 1);
  assert.deepEqual(f.states, [true]);
  f.recordings[0].resolve({ uri: 'completed.mp4' });
  await flush();
  assert.deepEqual(f.states, [true]);
  deletion.resolve();
  await flush();
  assert.deepEqual(f.states, [true, false]);
  assert.deepEqual(f.deleted, ['completed.mp4']);
  assert.deepEqual(f.errors, []);
});

test('missing native video after requested stop is an error, not a deletion success', async () => {
  const f = fixture();
  f.controller.setActive(true);
  f.controller.setActive(false);
  f.recordings[0].resolve(undefined);
  await flush();
  assert.equal(f.errors.length, 1);
  assert.deepEqual(f.deleted, []);
  assert.deepEqual(f.states, [true, false]);
});
