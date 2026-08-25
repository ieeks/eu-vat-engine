export type SapTreatment =
  | 'IC_SUPPLY'
  | 'IC_ACQUISITION'
  | 'TRIANGLE_SALE'
  | 'DOMESTIC_SALE'
  | 'DOMESTIC_PURCHASE'
  | 'EXPORT'
  | 'RC_DOMESTIC_SALE'
  | 'RC_DOMESTIC_PURCHASE'
  | 'NOT_TAXABLE'
  | 'INPUT_ZERO';

export interface SapMappingRequest {
  readonly companyId: string;
  readonly country: string;
  readonly treatment: SapTreatment;
}

export type SapMappingResult =
  | {
      readonly status: 'matched';
      readonly taxCode: string;
      readonly source: 'verified_legacy_mapping';
    }
  | {
      readonly status: 'unknown';
      readonly rationale: string;
    };

/**
 * Mappings migrated from the productive EPDE/EPROHA reference matrix and the
 * 2026-07-05 VK12/T007A reconciliation documented in the legacy knowledge base.
 * A missing mapping is intentional: V5 returns `unknown` and never invents an SAP code.
 */
const MAPPINGS: Readonly<Record<string, string>> = {
  // EPROHA — AT book circle
  'EPROHA|AT|IC_SUPPLY': 'AF',
  'EPROHA|AT|IC_ACQUISITION': 'VE',
  'EPROHA|AT|TRIANGLE_SALE': 'AF',
  'EPROHA|AT|DOMESTIC_SALE': 'A2',
  'EPROHA|AT|DOMESTIC_PURCHASE': 'V2',
  'EPROHA|AT|EXPORT': 'A0',
  'EPROHA|AT|NOT_TAXABLE': 'X0',

  // EPROHA — DE registration/book circle
  'EPROHA|DE|IC_SUPPLY': 'DH',
  'EPROHA|DE|IC_ACQUISITION': 'VH',
  'EPROHA|DE|DOMESTIC_SALE': 'DS',
  'EPROHA|DE|DOMESTIC_PURCHASE': 'VD',
  'EPROHA|DE|EXPORT': 'D0',

  // EPROHA — CH registration
  'EPROHA|CH|DOMESTIC_SALE': 'B5',
  'EPROHA|CH|DOMESTIC_PURCHASE': 'IB',

  // EPROHA — Italian inversione contabile (no IT registration)
  'EPROHA|IT|RC_DOMESTIC_SALE': 'IC',
  'EPROHA|IT|RC_DOMESTIC_PURCHASE': 'VT',

  // EPDE — DE main book circle
  'EPDE|DE|IC_SUPPLY': 'DH',
  'EPDE|DE|IC_ACQUISITION': 'VH',
  'EPDE|DE|DOMESTIC_SALE': 'DS',
  'EPDE|DE|DOMESTIC_PURCHASE': 'VD',
  'EPDE|DE|EXPORT': 'G0',
  'EPDE|DE|RC_DOMESTIC_PURCHASE': 'DC',
  'EPDE|DE|NOT_TAXABLE': 'XD',
  'EPDE|DE|INPUT_ZERO': 'P0',

  // EPDE — Slovenia
  'EPDE|SI|IC_SUPPLY': 'C1',
  'EPDE|SI|IC_ACQUISITION': 'EC',
  'EPDE|SI|DOMESTIC_SALE': 'CB',
  'EPDE|SI|DOMESTIC_PURCHASE': 'SI',

  // EPDE — Poland
  'EPDE|PL|IC_SUPPLY': 'T1',
  'EPDE|PL|IC_ACQUISITION': 'W5',
  'EPDE|PL|DOMESTIC_SALE': 'A4',
  'EPDE|PL|DOMESTIC_PURCHASE': 'B7',

  // EPDE — Czechia
  'EPDE|CZ|IC_SUPPLY': 'OB',
  'EPDE|CZ|IC_ACQUISITION': 'UR',
  'EPDE|CZ|DOMESTIC_SALE': 'AE',
  'EPDE|CZ|DOMESTIC_PURCHASE': 'VC',

  // EPDE — Netherlands. No verified IC-supply output code is stored.
  'EPDE|NL|IC_ACQUISITION': 'NP',
  'EPDE|NL|DOMESTIC_PURCHASE': 'NI',
  'EPDE|NL|RC_DOMESTIC_SALE': 'NC',
  'EPDE|NL|RC_DOMESTIC_PURCHASE': 'NI',

  // EPDE — Belgium. No verified IC-supply output code is stored.
  'EPDE|BE|IC_ACQUISITION': 'BP',
  'EPDE|BE|DOMESTIC_SALE': 'BS',
  'EPDE|BE|DOMESTIC_PURCHASE': 'BI',

  // EPDE — Latvia. No verified IC-supply output code is stored.
  'EPDE|LV|IC_ACQUISITION': 'LP',
  'EPDE|LV|DOMESTIC_SALE': 'LS',
  'EPDE|LV|DOMESTIC_PURCHASE': 'LI',

  // EPDE — Estonia. No verified IC-supply output code is stored.
  'EPDE|EE|IC_ACQUISITION': 'EP',
  'EPDE|EE|DOMESTIC_SALE': 'ES',
  'EPDE|EE|DOMESTIC_PURCHASE': 'EI',

  // EPDE — Italy (no IT registration)
  'EPDE|IT|IC_ACQUISITION': 'IP',
  'EPDE|IT|RC_DOMESTIC_SALE': 'IC',
  'EPDE|IT|RC_DOMESTIC_PURCHASE': 'VI',
};

export function resolveSapTaxCode(
  request: SapMappingRequest,
): SapMappingResult {
  const key = `${request.companyId.toUpperCase()}|${request.country.toUpperCase()}|${request.treatment}`;
  const taxCode = MAPPINGS[key];

  if (!taxCode) {
    return {
      status: 'unknown',
      rationale:
        'No verified SAP tax-code mapping is stored for this company/country/treatment combination. The engine does not invent tax codes.',
    };
  }

  return {
    status: 'matched',
    taxCode,
    source: 'verified_legacy_mapping',
  };
}
