import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeCheckDigits } from '../src/index.ts';
import { PUBLISHED_VALID } from './fixtures.ts';

describe('computeCheckDigits', () => {
  it('reproduces the check digits of the published examples', () => {
    for (const published of PUBLISHED_VALID) {
      const iban = published.replace(/ /g, '');
      assert.equal(computeCheckDigits(iban.slice(0, 2), iban.slice(4)), iban.slice(2, 4), published);
    }
  });

  it('accepts lower case', () => {
    assert.equal(computeCheckDigits('gb', 'nwbk60161331926819'), '29');
  });

  it('pads single-digit results with a zero', () => {
    assert.equal(computeCheckDigits('BE', '539007547034'), '68');
    let found = false;
    for (let n = 0; !found; n++) {
      const digits = computeCheckDigits('BE', String(n).padStart(12, '0'));
      assert.equal(digits.length, 2);
      found = digits.startsWith('0');
    }
  });

  it('rejects a country code that is not two letters', () => {
    for (const code of ['', 'G', 'GBR', 'G1', '12']) {
      assert.throws(() => computeCheckDigits(code, 'NWBK60161331926819'), RangeError, code);
    }
  });

  it('rejects an empty or non-alphanumeric BBAN', () => {
    for (const bban of ['', 'NWBK 6016', 'NWBK-6016', 'NWBKß']) {
      assert.throws(() => computeCheckDigits('GB', bban), RangeError, bban);
    }
  });

  it('throws a TypeError for arguments that are not strings', () => {
    assert.throws(() => computeCheckDigits(null as unknown as string, 'NWBK60161331926819'), TypeError);
    assert.throws(() => computeCheckDigits('GB', 42 as unknown as string), TypeError);
  });
});
