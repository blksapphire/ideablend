const test = require('node:test');
const assert = require('node:assert/strict');
const {
  requireIntParam,
  requireFields,
  normalizeEmail,
  assertMaxLength,
  optionalHttpUrl
} = require('../src/lib/validate');

test('requireIntParam accepts positive integers and rejects everything else', () => {
  assert.equal(requireIntParam('42'), 42);
  for (const bad of ['0', '-1', 'abc', '1.5', '', null, undefined]) {
    assert.throws(() => requireIntParam(bad), err => err.status === 400);
  }
});

test('requireFields reports every missing field', () => {
  assert.throws(
    () => requireFields({ a: '', b: null }, ['a', 'b', 'c']),
    err => err.status === 400 && /a, b, c/.test(err.message)
  );
  assert.doesNotThrow(() => requireFields({ a: 'ok' }, ['a']));
});

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  Sam@Example.COM '), 'sam@example.com');
  assert.equal(normalizeEmail(undefined), '');
});

test('assertMaxLength only rejects values over the cap', () => {
  assert.doesNotThrow(() => assertMaxLength('abc', 3, 'name'));
  assert.throws(() => assertMaxLength('abcd', 3, 'name'), err => err.status === 400);
  assert.doesNotThrow(() => assertMaxLength(undefined, 3, 'name'));
});

test('optionalHttpUrl allows http(s) and rejects script schemes', () => {
  assert.equal(optionalHttpUrl('https://github.com/owner/repo'), 'https://github.com/owner/repo');
  assert.equal(optionalHttpUrl(''), null);
  assert.equal(optionalHttpUrl(null), null);
  assert.throws(() => optionalHttpUrl('javascript:alert(1)'), err => err.status === 400);
  assert.throws(() => optionalHttpUrl('not a url'), err => err.status === 400);
  assert.throws(() => optionalHttpUrl('ftp://example.com'), err => err.status === 400);
});
