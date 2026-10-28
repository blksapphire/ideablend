process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');

// Requiring the app loads every route module. This is a cheap regression
// guard against a broken import or a module that throws at require-time.
test('app module loads with every route wired', () => {
  const app = require('../src/app');
  assert.equal(typeof app, 'function');
});

test('CORS allows same-origin and localhost, blocks unknown origins', () => {
  const { isAllowed } = require('../src/lib/cors');
  assert.equal(isAllowed(undefined), true);
  assert.equal(isAllowed('http://localhost:5173'), true);
  assert.equal(isAllowed('https://ideablend.vercel.app'), true);
  assert.equal(isAllowed('https://evil.example.com'), false);
});
