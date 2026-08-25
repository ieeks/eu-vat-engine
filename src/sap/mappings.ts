export type SapTreatment =
  | 'IC_SUPPLY'
  | 'IC_ACQUISITION'
  | 'TRIANGLE_SALE'
  | 'DOMESTIC_SALE'
  | 'DOMESTIC_PURCHASE'
  | 'EXPORT'
  | 'RC_DOMESTIC_SALE'
  | 'RC_DOMESTIC_PURCHASE';

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

const MAPPINGS: Readonly<Record<string, string>> = {
  'EPROHA|AT|IC_SUPPLY': 'AF',
  'EPROHA|DE|IC_SUPPLY': 'DH',
  'EPROHA|AT|IC_ACQUISITION': 'VE',
  'EPROHA|DE|IC_ACQUISITION': 'VH',
  'EPROHA|AT|TRIANGLE_SALE': 'AF',
  'EPROHA|AT|DOMESTIC_SALE': 'A2',
  'EPROHA|AT|DOMESTIC_PURCHASE': 'V2',
  'EPROHA|DE|DOMESTIC_SALE': 'DS',
  'EPROHA|DE|DOMESTIC_PURCHASE': 'VD',
  'EPROHA|AT|EXPORT': 'A0',
  'EPROHA|IT|RC_DOMESTIC_SALE': 'IC',
  'EPROHA|IT|RC_DOMESTIC_PURCHASE': 'VT',

  'EPDE|DE|IC_SUPPLY': 'DH',
  'EPDE|DE|IC_ACQUISITION': 'VH',
  'EPDE|DE|DOMESTIC_SALE': 'DS',
  'EPDE|DE|DOMESTIC_PURCHASE': 'VD',
  'EPDE|DE|EXPORT': 'G0',
  'EPDE|IT|RC_DOMESTIC_SALE': 'IC',
  'EPDE|IT|RC_DOMESTIC_PURCHASE': 'VI',
  'EPDE|NL|IC_ACQUISITION': 'NP',
  'EPDE|NL|RC_DOMESTIC_SALE': 'NC',
  'EPDE|NL|RC_DOMESTIC_PURCHASE': 'NI',
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
