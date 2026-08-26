export interface StandardVatRate {
  readonly country: string;
  readonly rate: number;
  readonly sourceId: string;
  readonly reviewedOn: string;
}

const EU_RATE_SOURCE_ID = 'EU_YOUR_EUROPE_VAT_RATES_2026';
const REVIEWED_ON = '2026-08-26';

/**
 * Standard rates only. Product-specific reduced/special rates are deliberately
 * outside this table and require a separate classification rule.
 * EU source last checked by the Commission/Your Europe on 2026-07-13.
 */
export const STANDARD_VAT_RATES: Readonly<Record<string, StandardVatRate>> = {
  AT: { country: 'AT', rate: 20, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  BE: { country: 'BE', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  BG: { country: 'BG', rate: 20, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  CY: { country: 'CY', rate: 19, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  CZ: { country: 'CZ', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  DE: { country: 'DE', rate: 19, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  DK: { country: 'DK', rate: 25, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  EE: { country: 'EE', rate: 24, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  ES: { country: 'ES', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  FI: { country: 'FI', rate: 25.5, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  FR: { country: 'FR', rate: 20, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  GR: { country: 'GR', rate: 24, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  HR: { country: 'HR', rate: 25, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  HU: { country: 'HU', rate: 27, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  IE: { country: 'IE', rate: 23, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  IT: { country: 'IT', rate: 22, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  LT: { country: 'LT', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  LU: { country: 'LU', rate: 17, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  LV: { country: 'LV', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  MT: { country: 'MT', rate: 18, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  NL: { country: 'NL', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  PL: { country: 'PL', rate: 23, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  PT: { country: 'PT', rate: 23, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  RO: { country: 'RO', rate: 21, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  SE: { country: 'SE', rate: 25, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  SI: { country: 'SI', rate: 22, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  SK: { country: 'SK', rate: 23, sourceId: EU_RATE_SOURCE_ID, reviewedOn: REVIEWED_ON },
  CH: { country: 'CH', rate: 8.1, sourceId: 'CH_ESTV_STANDARD_RATE_2026', reviewedOn: REVIEWED_ON },
};

export const VAT_RATE_SOURCES = {
  [EU_RATE_SOURCE_ID]: {
    id: EU_RATE_SOURCE_ID,
    title: 'Your Europe — VAT rates applied in EU countries',
    url: 'https://europa.eu/youreurope/business/finance-and-tax/vat/vat-rules-rates/index_en.htm',
    reviewedOn: REVIEWED_ON,
  },
  CH_ESTV_STANDARD_RATE_2026: {
    id: 'CH_ESTV_STANDARD_RATE_2026',
    title: 'Swiss Federal Tax Administration — current Swiss VAT rates',
    url: 'https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz',
    reviewedOn: REVIEWED_ON,
  },
} as const;

export function getStandardVatRate(country: string): StandardVatRate | undefined {
  return STANDARD_VAT_RATES[country.toUpperCase()];
}
