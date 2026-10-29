const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('ts-node/register/transpile-only');

const { getSafeErrorMeta } = require(
  path.resolve(__dirname, 'shared-with-frontend/get-safe-error-meta.ts'),
);

test('keeps only error name and code, excluding message, stack, cause and credentials', () => {
  const error = Object.assign(new TypeError('C:/private/report.txt password=secret'), {
    code: 'EACCES',
    cause: { token: 'private-token' },
    password: 'secret',
  });

  assert.deepEqual(getSafeErrorMeta(error), {
    errorName: 'TypeError',
    errorCode: 'EACCES',
  });
});

test('accepts plain error objects and numeric codes including zero', () => {
  assert.deepEqual(getSafeErrorMeta({ name: 'HttpError', code: 0, message: 'secret' }), {
    errorName: 'HttpError',
    errorCode: 0,
  });
});

test('omits missing and unsupported error codes', () => {
  for (const code of [undefined, null, {}, true]) {
    assert.deepEqual(getSafeErrorMeta({ name: 'Error', code }), { errorName: 'Error' });
  }
});

test('returns a safe fallback for non-error values and invalid names', () => {
  for (const value of [undefined, null, 'secret', 42, {}, { name: 42 }]) {
    assert.deepEqual(getSafeErrorMeta(value), { errorName: 'UnknownError' });
  }
});
