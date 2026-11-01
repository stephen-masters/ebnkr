/**
 * Smoke test of the built package: imports dist/ the way a consumer would,
 * through the package's own name and "exports" map, with no TypeScript.
 * Run after `npm run build`.
 */
import assert from 'node:assert/strict';
import { computeCheckDigits, isValidIban, printFormat, registry, validateIban } from 'ebnkr';

assert.equal(isValidIban('GB29 NWBK 6016 1331 9268 19'), true);
assert.equal(validateIban('GB28 NWBK 6016 1331 9268 19').valid, false);
assert.equal(printFormat('gb29nwbk60161331926819'), 'GB29 NWBK 6016 1331 9268 19');
assert.equal(computeCheckDigits('GB', 'NWBK60161331926819'), '29');
assert.ok(Object.keys(registry).length >= 89);
console.log('dist/ imports and validates as expected.');
