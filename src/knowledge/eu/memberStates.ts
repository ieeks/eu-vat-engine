import type { CountryCode } from '../../domain/transaction.js';

/**
 * EU Member States used by the legal scope checks.
 * Baseline: EU-27, reviewed for the 2026-08 project baseline.
 *
 * This is reference data, not VAT decision logic. If EU membership changes,
 * update this module and its provenance record rather than changing Art. 36a code.
 */
export const EU_MEMBER_STATES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DE', 'DK', 'EE',
  'EL', 'ES', 'FI', 'FR', 'HU', 'IE', 'IT', 'LT', 'LU',
  'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const;

const EU_MEMBER_STATE_SET = new Set<string>(EU_MEMBER_STATES);

export function isEuMemberState(country: CountryCode): boolean {
  return EU_MEMBER_STATE_SET.has(country.toUpperCase());
}
