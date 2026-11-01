import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { electronicFormat, printFormat } from '../src/index.ts';

describe('electronicFormat', () => {
  it('removes the spaces of the paper format', () => {
    assert.equal(electronicFormat('GB29 NWBK 6016 1331 9268 19'), 'GB29NWBK60161331926819');
  });

  it('removes hyphens, tabs, line breaks and no-break spaces', () => {
    assert.equal(electronicFormat('GB29-NWBK\t6016\n1331 9268 19'), 'GB29NWBK60161331926819');
  });

  it('converts letters to upper case', () => {
    assert.equal(electronicFormat('gb29 nwbk 6016 1331 9268 19'), 'GB29NWBK60161331926819');
  });

  it('keeps other characters so that validation can report them', () => {
    assert.equal(electronicFormat('GB29.NWBK'), 'GB29.NWBK');
  });

  it('leaves an empty string empty', () => {
    assert.equal(electronicFormat(''), '');
  });

  it('throws a TypeError for anything but a string', () => {
    for (const value of [null, undefined, 42, {}, ['GB29']]) {
      assert.throws(() => electronicFormat(value as string), TypeError);
    }
  });
});

describe('printFormat', () => {
  it('groups the electronic format in fours, as ISO 13616-1 specifies', () => {
    assert.equal(printFormat('GB29NWBK60161331926819'), 'GB29 NWBK 6016 1331 9268 19');
  });

  it('regroups an IBAN written with other separators', () => {
    assert.equal(printFormat('mk07-300-0000000424-25'), 'MK07 3000 0000 0042 425');
  });

  it('leaves no trailing space when the length is a multiple of four', () => {
    assert.equal(printFormat('BE68539007547034'), 'BE68 5390 0754 7034');
  });

  it('formats strings shorter than one group', () => {
    assert.equal(printFormat(''), '');
    assert.equal(printFormat('gb2'), 'GB2');
  });

  it('throws a TypeError for anything but a string', () => {
    assert.throws(() => printFormat(undefined as unknown as string), TypeError);
  });
});
