import type { YesNoUnknown } from './vatCase.js';

export interface NationalRcContext {
  readonly country: string;
  readonly sellerEstablished: boolean;
  readonly sellerVatRegistered: boolean;
  readonly buyerEstablished: YesNoUnknown;
  readonly buyerVatRegistered: YesNoUnknown;
  readonly buyerPeriodicReturnFiler: YesNoUnknown;
}

export type NationalRcResult =
  | {
      readonly status: 'applies';
      readonly country: string;
      readonly sourceId: string;
      readonly rationale: string;
    }
  | {
      readonly status: 'does_not_apply';
      readonly country: string;
      readonly sourceId: string;
      readonly rationale: string;
    }
  | {
      readonly status: 'indeterminate';
      readonly country: string;
      readonly sourceId: string;
      readonly missingFacts: readonly string[];
      readonly rationale: string;
    }
  | {
      readonly status: 'country_rule_not_verified';
      readonly country: string;
      readonly rationale: string;
    };

export function evaluateNationalReverseCharge(
  context: NationalRcContext,
): NationalRcResult {
  const country = context.country.toUpperCase();

  if (context.sellerEstablished) {
    return {
      status: 'does_not_apply',
      country,
      sourceId: 'GENERAL_ESTABLISHED_SUPPLIER',
      rationale:
        'This non-established-supplier reverse-charge rule is not available because the seller is established in the country of supply.',
    };
  }

  if (country === 'IT') {
    if (context.buyerEstablished === 'unknown') {
      return {
        status: 'indeterminate',
        country,
        sourceId: 'IT_DPR633_ART17_2',
        missingFacts: ['buyerEstablished'],
        rationale:
          'Italian Article 17(2) treatment depends on whether the taxable customer is established in Italy.',
      };
    }

    if (context.buyerEstablished === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'IT_DPR633_ART17_2',
        rationale:
          'For a supply by a non-established supplier to an Italian-established taxable customer, the Italian reverse charge applies; direct supplier VAT identification alone is not treated as establishment.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'IT_DPR633_ART17_2',
      rationale:
        'The recorded buyer is not established in Italy, so this verified Article 17(2) branch does not establish reverse charge.',
    };
  }

  if (country === 'BE') {
    if (context.buyerPeriodicReturnFiler === 'unknown') {
      return {
        status: 'indeterminate',
        country,
        sourceId: 'BE_VAT_CODE_ART51_2_5',
        missingFacts: ['buyerPeriodicReturnFiler'],
        rationale:
          'The verified Belgian branch depends on whether the customer is a qualifying periodic VAT return filer.',
      };
    }

    if (context.buyerPeriodicReturnFiler === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'BE_VAT_CODE_ART51_2_5',
        rationale:
          'The supplier is not established in Belgium and the customer is recorded as a qualifying periodic VAT return filer. Direct seller VAT registration is not used as an automatic blocker.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'BE_VAT_CODE_ART51_2_5',
      rationale:
        'The verified Belgian periodic-filer condition is not met on the recorded facts.',
    };
  }

  return {
    status: 'country_rule_not_verified',
    country,
    rationale:
      'No verified national goods reverse-charge rule is active for this country in the current knowledge baseline.',
  };
}
