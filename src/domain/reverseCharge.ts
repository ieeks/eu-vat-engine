import type { YesNoUnknown } from './vatCase.js';

export type DomesticTransactionType =
  | 'ordinary_goods'
  | 'installation_goods'
  | 'service'
  | 'special_goods';

export interface NationalRcContext {
  readonly country: string;
  readonly sellerEstablished: boolean;
  readonly sellerVatRegistered: boolean;
  readonly buyerEstablished: YesNoUnknown;
  readonly buyerVatRegistered: YesNoUnknown;
  readonly buyerPeriodicReturnFiler: YesNoUnknown;
  readonly buyerTaxablePerson?: YesNoUnknown;
  readonly buyerGeneralSchemeVatRegistered?: YesNoUnknown;
  readonly transactionType?: DomesticTransactionType;
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

function preferred(
  explicit: YesNoUnknown | undefined,
  fallback: YesNoUnknown,
): YesNoUnknown {
  return explicit ?? fallback;
}

function indeterminate(
  country: string,
  sourceId: string,
  missingFacts: readonly string[],
  rationale: string,
): NationalRcResult {
  return { status: 'indeterminate', country, sourceId, missingFacts, rationale };
}

/**
 * Evaluates the general B2B domestic-goods reverse-charge branch for countries
 * whose rule has been verified in the knowledge layer. Product-specific domestic
 * reverse-charge regimes (scrap, construction, electronics, etc.) are not inferred
 * from this function and require an explicit special-goods ruleset.
 */
export function evaluateNationalReverseCharge(
  context: NationalRcContext,
): NationalRcResult {
  const country = context.country.toUpperCase();
  const transactionType = context.transactionType ?? 'ordinary_goods';

  if (context.sellerEstablished) {
    return {
      status: 'does_not_apply',
      country,
      sourceId: 'GENERAL_ESTABLISHED_SUPPLIER',
      rationale:
        'The non-established-supplier reverse-charge branch is unavailable because the seller is established in the country of supply.',
    };
  }

  if (transactionType !== 'ordinary_goods') {
    return {
      status: 'country_rule_not_verified',
      country,
      rationale:
        'This evaluator is limited to ordinary domestic goods. Installation supplies, services and special reverse-charge goods require their dedicated rules.',
    };
  }

  if (country === 'IT') {
    if (context.buyerEstablished === 'unknown') {
      return indeterminate(
        country,
        'IT_DPR633_ART17_2',
        ['buyerEstablished'],
        'Italian Article 17(2) treatment depends on whether the taxable customer is established in Italy.',
      );
    }

    if (context.buyerEstablished === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'IT_DPR633_ART17_2',
        rationale:
          'For an ordinary supply by a non-established supplier to an Italian-established taxable customer, the Italian reverse charge applies; direct supplier VAT identification alone is not establishment.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'IT_DPR633_ART17_2',
      rationale:
        'The recorded buyer is not established in Italy, so the verified Article 17(2) branch does not establish reverse charge.',
    };
  }

  if (country === 'BE') {
    if (context.buyerPeriodicReturnFiler === 'unknown') {
      return indeterminate(
        country,
        'BE_VAT_CODE_ART51_2_5',
        ['buyerPeriodicReturnFiler'],
        'The verified Belgian branch depends on whether the customer is a qualifying periodic VAT return filer.',
      );
    }

    if (context.buyerPeriodicReturnFiler === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'BE_VAT_CODE_ART51_2_5',
        rationale:
          'The supplier is not established in Belgium and the customer is a qualifying periodic VAT return filer. Direct seller VAT registration is not used as an automatic blocker.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'BE_VAT_CODE_ART51_2_5',
      rationale:
        'The verified Belgian periodic-return-filer condition is not met on the recorded facts.',
    };
  }

  if (country === 'NL') {
    if (context.buyerEstablished === 'unknown') {
      return indeterminate(
        country,
        'NL_FOREIGN_SUPPLIER_SHIFT',
        ['buyerEstablished'],
        'The Dutch foreign-supplier shift depends on whether the customer is established or fixed-established in the Netherlands.',
      );
    }

    if (context.buyerEstablished === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'NL_FOREIGN_SUPPLIER_SHIFT',
        rationale:
          'A supplier established outside the Netherlands supplies ordinary goods in the Netherlands to a Netherlands-established customer; Dutch VAT is generally shifted to the customer. A Dutch VAT registration alone is not treated as establishment.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'NL_FOREIGN_SUPPLIER_SHIFT',
      rationale:
        'The customer is not established or fixed-established in the Netherlands, so this verified foreign-supplier shift does not apply.',
    };
  }

  if (country === 'PL') {
    if (context.sellerVatRegistered) {
      return {
        status: 'does_not_apply',
        country,
        sourceId: 'PL_VAT_ACT_ART17_1_5',
        rationale:
          'For ordinary goods, Article 17(1)(5) requires the foreign supplier not to be registered for Polish VAT. The seller is recorded as registered, so the supplier remains liable under this branch.',
      };
    }

    const buyerTaxable = preferred(context.buyerTaxablePerson, context.buyerVatRegistered);
    if (context.buyerEstablished === 'unknown' || buyerTaxable === 'unknown') {
      const missing: string[] = [];
      if (context.buyerEstablished === 'unknown') missing.push('buyerEstablished');
      if (buyerTaxable === 'unknown') missing.push('buyerTaxablePerson');
      return indeterminate(
        country,
        'PL_VAT_ACT_ART17_1_5',
        missing,
        'The Polish ordinary-goods reverse charge requires a qualifying Polish-established/fixed-established buyer and a non-established, non-registered foreign supplier.',
      );
    }

    if (context.buyerEstablished === 'yes' && buyerTaxable === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'PL_VAT_ACT_ART17_1_5',
        rationale:
          'The supplier is neither established nor VAT-registered in Poland and the buyer is a qualifying Polish-established taxable person, so Article 17(1)(5) shifts VAT to the buyer.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'PL_VAT_ACT_ART17_1_5',
      rationale:
        'The qualifying Polish buyer conditions for Article 17(1)(5) are not met on the recorded facts.',
    };
  }

  if (country === 'CZ') {
    if (context.sellerVatRegistered) {
      return {
        status: 'does_not_apply',
        country,
        sourceId: 'CZ_VAT_ACT_108_3_B',
        rationale:
          'The verified Section 108(3)(b) ordinary-goods branch is for a non-established supplier without valid Czech payer registration. The seller is recorded as Czech VAT-registered.',
      };
    }

    if (context.buyerVatRegistered === 'unknown') {
      return indeterminate(
        country,
        'CZ_VAT_ACT_108_3_B',
        ['buyerVatRegistered'],
        'Section 108(3)(b) requires the customer to be a registered Czech payer.',
      );
    }

    if (context.buyerVatRegistered === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'CZ_VAT_ACT_108_3_B',
        rationale:
          'A non-established supplier without valid Czech payer registration supplies ordinary goods in Czechia to a registered payer, so the tax obligation transfers to the customer under Section 108(3)(b).',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'CZ_VAT_ACT_108_3_B',
      rationale: 'The customer is not recorded as a registered Czech payer.',
    };
  }

  if (country === 'SI') {
    if (context.sellerVatRegistered) {
      return {
        status: 'does_not_apply',
        country,
        sourceId: 'SI_ZDDV1_ART76_3',
        rationale:
          'The foreign supplier is recorded as Slovenian VAT-identified. Under the verified Slovenian branch, an identified foreign supplier becomes the person liable instead of using Article 76(3) recipient liability.',
      };
    }

    const buyerGeneral = preferred(
      context.buyerGeneralSchemeVatRegistered,
      context.buyerVatRegistered,
    );
    if (buyerGeneral === 'unknown') {
      return indeterminate(
        country,
        'SI_ZDDV1_ART76_3',
        ['buyerGeneralSchemeVatRegistered'],
        'The Slovenian Article 76(3) branch requires the customer to be identified for VAT under the general scheme rather than merely an atypical identifier.',
      );
    }

    if (buyerGeneral === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'SI_ZDDV1_ART76_3',
        rationale:
          'The supplier is not established or VAT-identified in Slovenia and the customer is identified under the general VAT scheme, so the recipient is liable under Article 76(3).',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'SI_ZDDV1_ART76_3',
      rationale: 'The customer is not recorded as VAT-identified under the Slovenian general scheme.',
    };
  }

  if (country === 'EE') {
    if (context.sellerVatRegistered) {
      return {
        status: 'does_not_apply',
        country,
        sourceId: 'EE_VAT_ACT_GENERAL_RC',
        rationale:
          'The Estonian general foreign-supplier reverse-charge branch requires the supplier not to be registered as a taxable person in Estonia. The seller is recorded as registered.',
      };
    }

    if (context.buyerVatRegistered === 'unknown') {
      return indeterminate(
        country,
        'EE_VAT_ACT_GENERAL_RC',
        ['buyerVatRegistered'],
        'The Estonian general reverse-charge branch depends on the purchaser being registered as a taxable person in Estonia.',
      );
    }

    if (context.buyerVatRegistered === 'yes') {
      return {
        status: 'applies',
        country,
        sourceId: 'EE_VAT_ACT_GENERAL_RC',
        rationale:
          'The foreign supplier is neither established nor VAT-registered in Estonia and supplies an Estonian VAT-registered purchaser, so the general reverse VAT liability shifts tax to the purchaser.',
      };
    }

    return {
      status: 'does_not_apply',
      country,
      sourceId: 'EE_VAT_ACT_GENERAL_RC',
      rationale: 'The purchaser is not recorded as VAT-registered in Estonia.',
    };
  }

  if (country === 'LV') {
    if (context.sellerVatRegistered) {
      return {
        status: 'does_not_apply',
        country,
        sourceId: 'LV_GENERAL_VAT',
        rationale:
          'For ordinary goods, the verified Latvian general guidance applies normal domestic VAT to a locally VAT-registered supplier. Latvia has separate reverse-charge regimes for specified goods/services, which are not assumed here.',
      };
    }

    return {
      status: 'country_rule_not_verified',
      country,
      rationale:
        'The current Latvian source baseline does not justify activating a generic foreign-supplier reverse charge for ordinary goods. Registration or another statutory exception must be reviewed rather than guessed.',
    };
  }

  return {
    status: 'country_rule_not_verified',
    country,
    rationale:
      'No verified national ordinary-goods reverse-charge rule is active for this country in the current knowledge baseline.',
  };
}
