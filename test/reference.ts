/**
 * An independent implementation of the ISO 13616 checksum, for checking the
 * library against. It is the textbook method, deliberately different from
 * the library's: rearrange, expand every letter to two digits, and take the
 * whole number modulo 97 with BigInt.
 */
export function referenceMod97(iban: string): bigint {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = Array.from(rearranged).map(c => (/[0-9]/.test(c) ? c : String(c.charCodeAt(0) - 55))).join('');
  return BigInt(digits) % 97n;
}
