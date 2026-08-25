import type { CountryCode } from '../../domain/transaction.js';

/**
 * EU Member States used by legal scope checks.
 * Baseline: EU-27, reviewed for the 2026-08 project baseline.
 *
 * Internal jurisdiction codes use ISO 3166-1 alpha-2. VAT-ID prefixes are a
 * separate concept (notably Greece: country GR, VAT prefix EL).
 */
export const EU_MEMBER_STATES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DE', 'DK', 'EE',
  'ES', 'FI', 'FR', 'GR', 'HU', 'IE', 'IT', 'LT', 'LU',
  'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const;

const EU_MEMBER_STATE_SET = new Set<string>(EU_MEMBER_STATES);

export function isEuMemberState(country: CountryCode): boolean {
  return EU_MEMBER_STATE_SET.has(country.toUpperCase());
}
