import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { registry } from '../src/index.ts';

const STRUCTURE_TOKEN = /(\d+)!([nac])/g;

describe('registry', () => {
  const entries = Object.entries(registry);

  it('lists the SWIFT IBAN Registry countries, keyed by ISO 3166-1 alpha-2 code', () => {
    assert.ok(entries.length >= 89, `only ${String(entries.length)} countries`);
    for (const [country] of entries) {
      assert.match(country, /^[A-Z]{2}$/);
    }
  });

  it('cannot be changed at runtime', () => {
    assert.ok(Object.isFrozen(registry));
    assert.throws(() => {
      (registry as Record<string, unknown>).XX = {};
    }, TypeError);
  });

  it('gives each country a length of four more than its BBAN structure', () => {
    for (const [country, spec] of entries) {
      const bbanLength = [...spec.bbanStructure.matchAll(STRUCTURE_TOKEN)].reduce((sum, [, n]) => sum + Number(n), 0);
      assert.equal(spec.length, bbanLength + 4, country);
      assert.ok(spec.length <= 34, `${country}: ISO 13616 allows at most 34 characters`);
    }
  });

  it('gives each country a BBAN pattern that is anchored and matches its own structure', () => {
    const sample = { n: '7', a: 'Q', c: 'Z' } as const;
    for (const [country, spec] of entries) {
      assert.ok(spec.bban.source.startsWith('^') && spec.bban.source.endsWith('$'), country);
      const example = [...spec.bbanStructure.matchAll(STRUCTURE_TOKEN)]
        .map(([, n, kind]) => sample[kind as keyof typeof sample].repeat(Number(n)))
        .join('');
      assert.match(example, spec.bban, country);
      assert.doesNotMatch(`${example}0`, spec.bban, `${country}: one character too many`);
      assert.doesNotMatch(example.slice(1), spec.bban, `${country}: one character too few`);
    }
  });

  it('agrees with lengths published in the registry', () => {
    // Spot checks against the SWIFT IBAN Registry, including the shortest
    // (Norway) and the longest (Russia).
    const published = { NO: 15, BE: 16, DE: 22, GB: 22, FR: 27, MT: 31, LC: 32, RU: 33 };
    for (const [country, length] of Object.entries(published)) {
      assert.equal(registry[country]?.length, length, country);
    }
  });

  it('leaves out territories whose IBANs use another country\'s code', () => {
    // Åland uses FI; Jersey, Guernsey and the Isle of Man use GB; the French
    // overseas territories use FR.
    for (const territory of ['AX', 'JE', 'GG', 'IM', 'GF', 'GP', 'RE', 'NC']) {
      assert.equal(registry[territory], undefined, territory);
    }
  });

  it('marks SEPA membership', () => {
    assert.equal(registry.DE?.sepa, true);
    assert.equal(registry.GB?.sepa, true);
    assert.equal(registry.AE?.sepa, false);
  });
});
