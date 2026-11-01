/**
 * Property-based tests: fast-check generates thousands of IBANs for every
 * country in the registry and checks what must hold for all of them.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fc from 'fast-check';
import { computeCheckDigits, electronicFormat, printFormat, registry, validateIban } from '../src/index.ts';
import { referenceMod97 } from './reference.ts';

const DIGITS = '0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CLASSES = { n: DIGITS, a: LETTERS, c: DIGITS + LETTERS } as const;
const RUNS = { numRuns: 2000 };

const country = fc.constantFrom(...Object.keys(registry));

/** A BBAN that follows a country's structure in the registry. */
function bbanFor(code: string): fc.Arbitrary<string> {
  const structure = registry[code]?.bbanStructure ?? '';
  const fields = [...structure.matchAll(/(\d+)!([nac])/g)].map(([, n, kind]) =>
    fc.string({
      unit: fc.constantFrom(...Array.from(CLASSES[kind as keyof typeof CLASSES])),
      minLength: Number(n),
      maxLength: Number(n)
    })
  );
  return fc.tuple(...fields).map(parts => parts.join(''));
}

const countryAndBban = country.chain(code => fc.tuple(fc.constant(code), bbanFor(code)));

/** A valid IBAN in electronic format, for any country in the registry. */
const validIban = countryAndBban.map(([code, bban]) => `${code}${computeCheckDigits(code, bban)}${bban}`);

function sameClass(a: string, b: string): boolean {
  return DIGITS.includes(a) === DIGITS.includes(b);
}

describe('properties', () => {
  it('every generated IBAN is valid, and splits back into its parts', () => {
    fc.assert(fc.property(countryAndBban, ([code, bban]) => {
      const checkDigits = computeCheckDigits(code, bban);
      const result = validateIban(`${code}${checkDigits}${bban}`);
      assert.deepEqual(result, { valid: true, iban: `${code}${checkDigits}${bban}`, countryCode: code, checkDigits, bban });
    }), RUNS);
  });

  it('check digits are always between 02 and 98, and satisfy the reference checksum', () => {
    fc.assert(fc.property(countryAndBban, ([code, bban]) => {
      const checkDigits = computeCheckDigits(code, bban);
      assert.match(checkDigits, /^[0-9]{2}$/);
      const value = Number(checkDigits);
      assert.ok(value >= 2 && value <= 98, checkDigits);
      assert.equal(referenceMod97(`${code}${checkDigits}${bban}`), 1n);
    }), RUNS);
  });

  it('the print format and lower case validate the same as the electronic format', () => {
    fc.assert(fc.property(validIban, iban => {
      assert.equal(electronicFormat(printFormat(iban)), iban);
      assert.ok(validateIban(printFormat(iban)).valid);
      assert.ok(validateIban(iban.toLowerCase()).valid);
      assert.ok(validateIban(printFormat(iban).replace(/ /g, '-')).valid);
    }), RUNS);
  });

  it('detects any change of one character in the account number', () => {
    // Changing one digit moves the rearranged number by d × 10^k, and one
    // letter by v × 10^k, with 0 < |d| < 10 and 0 < |v| < 26. 97 is prime and
    // divides neither factor, so the remainder must change: ISO 7064 MOD
    // 97-10 catches every single substitution.
    fc.assert(fc.property(validIban, fc.nat(), fc.nat(), (iban, at, pick) => {
      const position = 4 + (at % (iban.length - 4));
      const original = iban.charAt(position);
      const pool = (DIGITS.includes(original) ? DIGITS : LETTERS).replace(original, '');
      const changed = iban.slice(0, position) + pool.charAt(pick % pool.length) + iban.slice(position + 1);
      const result = validateIban(changed);
      assert.equal(result.valid, false, changed);
      assert.equal(result.error, 'checksum-failed', changed);
    }), RUNS);
  });

  it('detects any swap of two neighbouring, different characters of the same kind', () => {
    // Swapping neighbouring digits a and b moves the number by (a − b) × 9 ×
    // 10^k; neighbouring letters, by (a − b) × 99 × 10^k. Neither 9 nor 99
    // shares a factor with 97, so every such transposition is caught.
    fc.assert(fc.property(validIban, fc.nat(), (iban, at) => {
      const swaps = [];
      for (let i = 4; i < iban.length - 1; i++) {
        const a = iban.charAt(i);
        const b = iban.charAt(i + 1);
        if (a !== b && sameClass(a, b)) swaps.push(i);
      }
      fc.pre(swaps.length > 0);
      const i = swaps[at % swaps.length] ?? 4;
      const swapped = iban.slice(0, i) + iban.charAt(i + 1) + iban.charAt(i) + iban.slice(i + 2);
      const result = validateIban(swapped);
      assert.ok(!result.valid && result.error === 'checksum-failed', swapped);
    }), RUNS);
  });

  it('agrees with the reference checksum on IBANs with arbitrary check digits', () => {
    fc.assert(fc.property(countryAndBban, fc.integer({ min: 0, max: 99 }), ([code, bban], digits) => {
      const checkDigits = String(digits).padStart(2, '0');
      const iban = `${code}${checkDigits}${bban}`;
      const expected = referenceMod97(iban) === 1n && !['00', '01', '99'].includes(checkDigits);
      assert.equal(validateIban(iban).valid, expected, iban);
    }), RUNS);
  });

  it('never throws, whatever it is given', () => {
    fc.assert(fc.property(fc.anything(), value => {
      const result = validateIban(value);
      assert.equal(typeof result.valid, 'boolean');
    }), RUNS);
    fc.assert(fc.property(fc.string({ unit: 'binary', maxLength: 60 }), value => {
      const result = validateIban(value);
      assert.ok(result.valid || result.message.length > 0);
    }), RUNS);
  });

  it('accepts only ASCII letters and digits, whatever the input', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary', maxLength: 40 }), value => {
      const result = validateIban(value);
      if (result.valid) assert.match(result.iban, /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/);
    }), RUNS);
  });
});
