import assert from 'node:assert/strict';
import test from 'node:test';
import { createChunkedStorage } from '../src/services/chunkedStorage.js';
import { authErrorMessage, normalizeEmail, validateEmail, validateNewPassword, validateOtp } from '../src/features/auth/validation.js';
import { IDLE_TIMEOUT, isSessionIdle } from '../src/features/auth/sessionPolicy.js';

function memoryStore() {
  const values = new Map();
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
}

test('sessions with Unicode metadata round-trip without exceeding small secure values', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  const session = JSON.stringify({ token: 'a'.repeat(3000), name: 'Bác sĩ 👩🏽‍⚕️'.repeat(150) });
  await storage.setItem('auth', session);
  assert.equal(await storage.getItem('auth'), session);
  for (const value of backend.values.values()) assert.ok(Buffer.byteLength(value, 'utf8') < 2048);
});

test('a failed new session write preserves the previous valid session', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  await storage.setItem('auth', 'previous-session');
  const originalWrite = backend.setItem;
  let writes = 0;
  backend.setItem = async (key, value) => {
    if (++writes === 2) throw new Error('Disk failure');
    await originalWrite(key, value);
  };
  await assert.rejects(storage.setItem('auth', 'new-session'.repeat(200)), /Disk failure/);
  assert.equal(await storage.getItem('auth'), 'previous-session');
  assert.equal(backend.values.size, 2);
});

test('failure to publish a manifest does not replace an existing session', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  await storage.setItem('auth', 'previous-session');
  const originalWrite = backend.setItem;
  backend.setItem = async (key, value) => {
    if (key.endsWith('.manifest')) throw new Error('Manifest failure');
    await originalWrite(key, value);
  };
  await assert.rejects(storage.setItem('auth', 'replacement'), /Manifest failure/);
  assert.equal(await storage.getItem('auth'), 'previous-session');
});

test('replacing and removing a session cleans its referenced secure chunks', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  await storage.setItem('auth', 'old'.repeat(1000));
  await storage.setItem('auth', 'new');
  assert.equal(backend.values.size, 2);
  assert.equal(await storage.getItem('auth'), 'new');
  await storage.removeItem('auth');
  assert.equal(await storage.getItem('auth'), null);
  assert.equal(backend.values.size, 0);
});

test('incomplete session chunks fail closed instead of returning partial tokens', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  await storage.setItem('auth', 'a'.repeat(1000));
  const key = [...backend.values.keys()].find((item) => item.endsWith('.1'));
  backend.values.delete(key);
  await assert.rejects(storage.getItem('auth'), /Incomplete stored session/);
});

test('corrupted manifests fail closed but can be replaced by a new verified login', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  backend.values.set('auth.manifest', '{broken-json');
  await assert.rejects(storage.getItem('auth'), /Invalid session storage manifest/);
  await storage.setItem('auth', 'new-valid-session');
  assert.equal(await storage.getItem('auth'), 'new-valid-session');
});

test('logout can remove a corrupted manifest without hiding native storage errors', async () => {
  const backend = memoryStore();
  const storage = createChunkedStorage(backend);
  backend.values.set('auth.manifest', 'null');
  await storage.removeItem('auth');
  assert.equal(backend.values.size, 0);
  backend.getItem = async () => { throw new Error('Native access denied'); };
  await assert.rejects(storage.setItem('auth', 'new'), /Native access denied/);
});

test('email normalization does not accept missing domains or embedded whitespace', () => {
  assert.equal(normalizeEmail('  Student@Example.com  '), 'student@example.com');
  assert.equal(validateEmail('student@example.com'), '');
  for (const email of ['', 'student@', 'student @example.com', 'student@example']) assert.notEqual(validateEmail(email), '');
});

test('password validation preserves spaces and requires an exact confirmation', () => {
  assert.notEqual(validateNewPassword('short', 'short'), '');
  assert.notEqual(validateNewPassword('correct password', 'correct password '), '');
  assert.equal(validateNewPassword(' correct password ', ' correct password '), '');
});

test('OTP accepts the configured numeric length and rejects pasted URLs or letters', () => {
  assert.equal(validateOtp(' 012345 '), '');
  assert.equal(validateOtp('12345678'), '');
  for (const value of ['123', '12345678901', 'abcdef', 'https://example.com']) assert.notEqual(validateOtp(value), '');
});

test('auth errors are localized and never echo server content or credentials', () => {
  assert.match(authErrorMessage({ code: 'invalid_credentials' }), /Email/);
  assert.ok(!authErrorMessage({ message: 'secret-token' }).includes('secret-token'));
  assert.ok(!authErrorMessage(new Error('secret-password')).includes('secret-password'));
});

test('session expires at exactly 15 minutes and cannot be revived by a future timestamp', () => {
  const now = 1_800_000;
  assert.equal(isSessionIdle(now - IDLE_TIMEOUT + 1, now), false);
  assert.equal(isSessionIdle(now - IDLE_TIMEOUT, now), true);
  for (const value of [0, NaN, Infinity, now + 1]) assert.equal(isSessionIdle(value, now), true);
});
