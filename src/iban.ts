import { registry, type CountrySpec } from './registry.ts';

/**
 * Why an IBAN failed validation, in the order the checks run. The first
 * failing check is the one reported.
 */
export type IbanErrorCode =
  /** The input was not a string. */
  | 'not-a-string'
  /** A character other than A–Z, a–z, 0–9, whitespace or a hyphen. */
  | 'invalid-characters'
  /** It does not start with a two-letter country code and two check digits. */
  | 'invalid-format'
  /** The country code is not in the SWIFT IBAN Registry. */
  | 'unknown-country'
  /** The length is not the one the registry gives for the country. */
  | 'wrong-length'
  /** The BBAN does not follow the country's structure in the registry. */
  | 'invalid-bban'
  /** The check digits are 00, 01 or 99, which ISO 7064 MOD 97-10 never produces. */
  | 'invalid-check-digits'
  /** The ISO 7064 MOD 97-10 checksum does not come out at 1. */
  | 'checksum-failed';

/** A successful validation, with the IBAN split into its parts. */
export interface ValidIban {
  readonly valid: true;
  /** The IBAN in electronic format: upper case, with no separators. */
  readonly iban: string;
  /** The ISO 3166-1 alpha-2 country code. */
  readonly countryCode: string;
  readonly checkDigits: string;
  /** The Basic Bank Account Number: everything after the check digits. */
  readonly bban: string;
}

/** A failed validation, with the reason. */
export interface InvalidIban {
  readonly valid: false;
  readonly error: IbanErrorCode;
  /** A sentence explaining the failure, suitable for showing to a person. */
  readonly message: string;
}

export type IbanValidation = ValidIban | InvalidIban;

/** Whitespace (including the no-break spaces of copied text) and hyphens. */
const SEPARATORS = /[\s-]/gu;
const ALPHANUMERIC = /^[A-Za-z0-9]*$/;
const COUNTRY_AND_CHECK_DIGITS = /^[A-Z]{2}[0-9]{2}/;

/**
 * Converts an IBAN to its electronic format: separators removed, letters in
 * upper case. Accepts the paper format of ISO 13616-1 (groups of four
 * separated by spaces), and hyphens, tabs or no-break spaces in its place.
 *
 * It does not validate. Characters other than letters, digits and separators
 * are kept, so that {@link validateIban} can report them.
 *
 * @throws {TypeError} If `iban` is not a string.
 */
export function electronicFormat(iban: string): string {
  assertString(iban, 'iban');
  return iban.replace(SEPARATORS, '').toUpperCase();
}

/**
 * Formats an IBAN for printing, as ISO 13616-1 specifies: the electronic
 * format in groups of four characters separated by single spaces, the last
 * group possibly shorter. For example `GB29 NWBK 6016 1331 9268 19`.
 *
 * @throws {TypeError} If `iban` is not a string.
 */
export function printFormat(iban: string): string {
  return electronicFormat(iban).replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * Validates an IBAN against ISO 13616-1 and the SWIFT IBAN Registry.
 *
 * Checks, in order: that the input is a string of letters, digits and
 * separators; that it starts with a country code and check digits; that the
 * country is in the registry; the length and BBAN structure the registry
 * gives for that country; that the check digits are ones ISO 7064 MOD 97-10
 * can produce; and the MOD 97-10 checksum itself.
 *
 * Never throws, whatever it is given.
 */
export function validateIban(input: unknown): IbanValidation {
  if (typeof input !== 'string') {
    return invalid('not-a-string', `Expected the IBAN as a string, but got ${describe(input)}.`);
  }

  // Check the characters before changing case: toUpperCase() turns some
  // non-ASCII letters into ASCII ones ('ß' into 'SS', dotless 'ı' into 'I').
  const compact = input.replace(SEPARATORS, '');
  if (!ALPHANUMERIC.test(compact)) {
    return invalid('invalid-characters', 'An IBAN may contain only letters A–Z, digits 0–9 and separating spaces.');
  }
  const iban = compact.toUpperCase();

  if (!COUNTRY_AND_CHECK_DIGITS.test(iban)) {
    return invalid('invalid-format', 'An IBAN starts with a two-letter country code followed by two check digits.');
  }

  const countryCode = iban.slice(0, 2);
  const checkDigits = iban.slice(2, 4);
  const bban = iban.slice(4);
  const spec: CountrySpec | undefined = registry[countryCode];
  if (spec === undefined) {
    return invalid('unknown-country', `${countryCode} is not a country in the SWIFT IBAN Registry.`);
  }
  if (iban.length !== spec.length) {
    return invalid(
      'wrong-length',
      `An IBAN for ${countryCode} has ${String(spec.length)} characters, but this one has ${String(iban.length)}.`
    );
  }
  if (!spec.bban.test(bban)) {
    return invalid(
      'invalid-bban',
      `The account number does not follow the structure for ${countryCode} (${spec.bbanStructure} in SWIFT's notation).`
    );
  }
  if (checkDigits === '00' || checkDigits === '01' || checkDigits === '99') {
    return invalid('invalid-check-digits', `${checkDigits} can never be the check digits of an IBAN.`);
  }
  if (mod97(bban + countryCode + checkDigits) !== 1) {
    return invalid('checksum-failed', 'The check digits do not match the rest of the IBAN.');
  }

  return { valid: true, iban, countryCode, checkDigits, bban };
}

/**
 * Whether `input` is a valid IBAN. The same checks as {@link validateIban},
 * without the reason. Never throws.
 */
export function isValidIban(input: unknown): boolean {
  return validateIban(input).valid;
}

/**
 * Computes the two ISO 7064 MOD 97-10 check digits for an IBAN with the
 * given country code and BBAN. They are always between 02 and 98.
 *
 * Only the arithmetic is done here: it does not check that the country is in
 * the registry or that the BBAN follows its structure. Pass the result to
 * {@link validateIban} for that.
 *
 * @throws {TypeError} If either argument is not a string.
 * @throws {RangeError} If the country code is not two letters, or the BBAN
 *   is empty or contains anything but letters and digits.
 */
export function computeCheckDigits(countryCode: string, bban: string): string {
  assertString(countryCode, 'countryCode');
  assertString(bban, 'bban');
  if (!/^[A-Za-z]{2}$/.test(countryCode)) {
    throw new RangeError('The country code must be two letters.');
  }
  if (!/^[A-Za-z0-9]+$/.test(bban)) {
    throw new RangeError('The BBAN must be one or more letters and digits.');
  }
  const remainder = mod97(bban.toUpperCase() + countryCode.toUpperCase() + '00');
  return String(98 - remainder).padStart(2, '0');
}

/**
 * The remainder, modulo 97, of the number formed by replacing each letter of
 * an upper-case alphanumeric string with two digits (A = 10 … Z = 35), as ISO
 * 13616 specifies. Works one character at a time, so the number never grows
 * beyond what a double holds exactly, however long the string.
 */
function mod97(alphanumeric: string): number {
  let remainder = 0;
  for (const character of alphanumeric) {
    const value = Number.parseInt(character, 36);
    remainder = (remainder * (value < 10 ? 10 : 100) + value) % 97;
  }
  return remainder;
}

function invalid(error: IbanErrorCode, message: string): InvalidIban {
  return { valid: false, error, message };
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string, but got ${describe(value)}.`);
  }
}

function describe(value: unknown): string {
  return value === null ? 'null' : typeof value;
}
