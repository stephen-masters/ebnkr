/**
 * IBAN validation and formatting against ISO 13616-1 and the SWIFT IBAN
 * Registry. Runs in browsers and in Node, with no runtime dependencies.
 *
 * @packageDocumentation
 */
export {
  computeCheckDigits,
  electronicFormat,
  isValidIban,
  printFormat,
  validateIban,
  type IbanErrorCode,
  type IbanValidation,
  type InvalidIban,
  type ValidIban
} from './iban.ts';
export { registry, type CountrySpec } from './registry.ts';
