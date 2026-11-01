import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeCheckDigits, isValidIban, validateIban, type IbanErrorCode } from '../src/index.ts';
import { PUBLISHED_INVALID, PUBLISHED_VALID } from './fixtures.ts';
import { referenceMod97 } from './reference.ts';

function label(input: unknown): string {
  return typeof input === 'string' ? JSON.stringify(input) : String(input);
}

function assertError(input: unknown, error: IbanErrorCode): void {
  const result = validateIban(input);
  assert.equal(result.valid, false, `${label(input)} should be invalid`);
  assert.equal(result.error, error, `${label(input)}: ${result.message}`);
  assert.match(result.message, /^[A-Z0-9].*\.$/u);
  assert.equal(isValidIban(input), false);
}

describe('validateIban', () => {
  it('accepts the published example IBANs', () => {
    for (const iban of PUBLISHED_VALID) {
      const result = validateIban(iban);
      assert.ok(result.valid, `${iban}: ${result.valid ? '' : result.message}`);
      assert.equal(isValidIban(iban), true);
    }
  });

  it('splits a valid IBAN into its parts, in electronic format', () => {
    assert.deepEqual(validateIban('gb29 nwbk 6016 1331 9268 19'), {
      valid: true,
      iban: 'GB29NWBK60161331926819',
      countryCode: 'GB',
      checkDigits: '29',
      bban: 'NWBK60161331926819'
    });
  });

  it('rejects the published invalid examples on their checksum', () => {
    for (const iban of PUBLISHED_INVALID) {
      assertError(iban, 'checksum-failed');
    }
  });

  describe('reports each failure', () => {
    it('not-a-string', () => {
      for (const value of [null, undefined, 42, 1n, true, {}, [], Symbol('iban'), () => 'GB29']) {
        assertError(value, 'not-a-string');
      }
    });

    it('invalid-characters', () => {
      assertError('GB29.NWBK.6016.1331.9268.19', 'invalid-characters');
      assertError('GB29 NWBK 6016 1331 9268 1!', 'invalid-characters');
    });

    it('invalid-format', () => {
      assertError('', 'invalid-format');
      assertError('   ', 'invalid-format');
      assertError('GB2', 'invalid-format');
      assertError('1229 NWBK 6016 1331 9268 19', 'invalid-format');
      assertError('GBX9 NWBK 6016 1331 9268 19', 'invalid-format');
    });

    it('unknown-country', () => {
      assertError('XX29 NWBK 6016 1331 9268 19', 'unknown-country');
    });

    it('wrong-length', () => {
      assertError('GB29 NWBK 6016 1331 9268 1', 'wrong-length');
      assertError('GB29 NWBK 6016 1331 9268 190', 'wrong-length');
    });

    it('invalid-bban', () => {
      // A UK BBAN is four letters (the bank) then fourteen digits.
      assertError('GB29 NWB1 6016 1331 9268 19', 'invalid-bban');
      assertError('GB29 NWBK 6016 1331 9268 1A', 'invalid-bban');
    });

    it('invalid-check-digits, even where the checksum would pass', () => {
      // The checksum fixes the check digits only modulo 97. Where the
      // proper digits are 97, 98 or 02, the digits 00, 01 or 99 satisfy it
      // too, but ISO 7064 MOD 97-10 never produces them.
      const alias = new Map([['97', '00'], ['98', '01'], ['02', '99']]);
      const found = new Set<string>();
      for (let n = 0; found.size < 3; n++) {
        const bban = `NWBK601613${String(n).padStart(8, '0')}`;
        const lookalike = alias.get(computeCheckDigits('GB', bban));
        if (lookalike === undefined || found.has(lookalike)) continue;
        found.add(lookalike);
        assert.equal(referenceMod97(`GB${lookalike}${bban}`), 1n, 'the checksum alone would accept it');
        assertError(`GB${lookalike}${bban}`, 'invalid-check-digits');
      }
    });

    it('checksum-failed', () => {
      assertError('GB28 NWBK 6016 1331 9268 19', 'checksum-failed');
    });
  });

  describe('fixes the bugs of the 2011 version', () => {
    it('rejects strings that only satisfy the checksum', () => {
      // The old validator accepted both: their remainder happens to be 1.
      assertError('1', 'invalid-format');
      assertError('0001', 'invalid-format');
    });

    it('rejects punctuation instead of silently removing it', () => {
      assertError('GB29-NWBK!6016*1331#9268@19', 'invalid-characters');
    });

    it('returns a result instead of throwing for non-strings', () => {
      assert.doesNotThrow(() => validateIban(null));
      assert.doesNotThrow(() => validateIban(undefined));
      assert.doesNotThrow(() => validateIban(123));
    });

    it('rejects the withdrawn country code CS', () => {
      // Serbia and Montenegro dissolved in 2006. Serbia's IBANs use RS.
      assertError('CS73 2404 3000 2546 2004 35', 'unknown-country');
    });
  });

  describe('is not fooled by Unicode', () => {
    it('rejects letters that only become ASCII in upper case', () => {
      // 'ß'.toUpperCase() is 'SS' and 'ı'.toUpperCase() is 'I'.
      assertError('GB29 NWBK 6016 1331 9268 19ß', 'invalid-characters');
      assertError('GB29 ıWBK 6016 1331 9268 19', 'invalid-characters');
    });

    it('rejects digits from other scripts', () => {
      assertError('GB29 NWBK 6016 1331 9268 1９', 'invalid-characters');
      assertError('GB29 NWBK 6016 1331 9268 1٩', 'invalid-characters');
    });

    it('rejects look-alike letters from other scripts', () => {
      // Cyrillic А and В in place of the Latin letters.
      assertError('GB29 NWВK 6016 1331 9268 19', 'invalid-characters');
    });

    it('rejects zero-width characters, which are not whitespace', () => {
      assertError('GB29 NWBK​6016 1331 9268 19', 'invalid-characters');
    });
  });
});

describe('isValidIban', () => {
  it('agrees with validateIban', () => {
    assert.equal(isValidIban('GB29 NWBK 6016 1331 9268 19'), true);
    assert.equal(isValidIban('GB28 NWBK 6016 1331 9268 19'), false);
  });
});
