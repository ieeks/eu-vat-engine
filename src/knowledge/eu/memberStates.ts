import type { CountryCode } from '../../domain/transaction.js';

export const EU_MEMBER_STATES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DE', 'DK', 'EE',
  'ES', 'FI', 'FR', 'GR', 'HU', 'IE', 'IT', 'LT', 'LU',
  'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const;

export const VAT_ID_PREFIX_BY_COUNTRY: Readonly<Record<string, string>> = {
  AT: 'AT', BE: 'BE', BG: 'BG', HR: 'HR', CY: 'CY', CZ: 'CZ',
  DE: 'DE', DK: 'DK', EE: 'EE', ES: 'ES', FI: 'FI', FR: 'FR',
  GR: 'EL', HU: 'HU', IE: 'IE', IT: 'IT', LT: 'LT', LU: 'LU',
  LV: 'LV', MT: 'MT', NL: 'NL', PL: 'PL', PT: 'PT', RO: 'RO',
  SE: 'SE', SI: 'SI', SK: 'SK',
};

const EU_MEMBER_STATE_SET = new Set<string>(EU_MEMBER_STATES);

export function isEuMemberState(country: CountryCode): boolean {
  return EU_MEMBER_STATE_SET.has(country.toUpperCase());
}
